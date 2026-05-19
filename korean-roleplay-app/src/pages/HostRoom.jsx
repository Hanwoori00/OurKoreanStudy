import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import QRCode from 'qrcode'

export default function HostRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [qrUrl, setQrUrl] = useState('')
  const qrRef = useRef()

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [roomId])

  useEffect(() => {
    const url = `${window.location.origin}/join/${roomId}`
    QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: '#f0eff5', light: '#18181c' } })
      .then(setQrUrl)
  }, [roomId])

  const selectSet = async (setIdx) => {
    await updateDoc(doc(db, 'rooms', roomId), {
      currentSet: setIdx,
      currentTurn: null,
      roles: {},
      status: 'selecting'
    })
  }

  const startGame = async () => {
    await updateDoc(doc(db, 'rooms', roomId), {
      currentTurn: 0,
      status: 'playing'
    })
  }

  const nextTurn = async () => {
    const set = room.sets[room.currentSet]
    const next = (room.currentTurn ?? 0) + 1
    if (next >= set.turns.length) {
      await updateDoc(doc(db, 'rooms', roomId), { status: 'finished' })
    } else {
      await updateDoc(doc(db, 'rooms', roomId), { currentTurn: next })
    }
  }

  const prevTurn = async () => {
    const prev = Math.max(0, (room.currentTurn ?? 0) - 1)
    await updateDoc(doc(db, 'rooms', roomId), { currentTurn: prev })
  }

  const resetRound = async () => {
    await updateDoc(doc(db, 'rooms', roomId), {
      currentSet: null,
      currentTurn: null,
      roles: {},
      status: 'waiting'
    })
  }

  if (!room) return <div className="page" style={{ color: 'var(--text3)' }}>로딩중...</div>

  const players = room.players || {}
  const roles = room.roles || {}
  const currentSet = room.currentSet != null ? room.sets[room.currentSet] : null

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em' }}>HOST</span>
            <span className="tag tag-accent">{room.name}</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300 }}>{room.name}</h2>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← 홈</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20, marginBottom: 28 }}>
        {/* Players */}
        <div className="card">
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em', marginBottom: 12 }}>
            PLAYERS ({Object.keys(players).length}/{room.playerCount})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(players).map(([pid, name]) => {
              const role = Object.entries(roles).find(([, id]) => id === pid)
              return (
                <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg3)', borderRadius: 8, padding: '6px 12px' }}>
                  <span style={{ fontSize: 13 }}>{name}</span>
                  {role && <span style={{ fontSize: 11, color: 'var(--accent2)' }}>{role[0]}</span>}
                </div>
              )
            })}
            {Object.keys(players).length === 0 && (
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>아직 참여자가 없어요</span>
            )}
          </div>
        </div>

        {/* QR */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {qrUrl && <img src={qrUrl} alt="QR" style={{ width: 160, borderRadius: 8 }} />}
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            {window.location.origin}/join/{roomId}
          </div>
        </div>
      </div>

      {/* Set Selection */}
      {room.status === 'waiting' || room.status === 'selecting' ? (
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em', marginBottom: 12 }}>
            상황 선택
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {room.sets.map((set, idx) => (
              <button
                key={idx}
                className={`card ${room.currentSet === idx ? 'btn-primary' : ''}`}
                onClick={() => selectSet(idx)}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  border: room.currentSet === idx ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: room.currentSet === idx ? 'var(--accent-bg)' : 'var(--bg2)',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{set.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{set.situation}</div>
              </button>
            ))}
          </div>

          {room.currentSet != null && room.status === 'selecting' && (
            <div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em', marginBottom: 12 }}>
                역할 배정 현황
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                {currentSet.roles.map((role, ri) => {
                  const assignedPid = roles[role.name]
                  const assignedName = assignedPid ? players[assignedPid] : null
                  return (
                    <div key={ri} className="card" style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{role.emoji}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{role.label}</div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{role.name}</div>
                      {assignedName
                        ? <span className="tag tag-green">{assignedName}</span>
                        : <span style={{ fontSize: 12, color: 'var(--text3)' }}>미배정</span>
                      }
                    </div>
                  )
                })}
              </div>

              {Object.keys(roles).length === currentSet.roles.length && (
                <button className="btn btn-primary btn-lg" onClick={startGame}>
                  🚀 게임 시작!
                </button>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Game View - Full Table */}
      {(room.status === 'playing' || room.status === 'finished') && currentSet && (
        <div className="fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 2 }}>{currentSet.title}</div>
              <div style={{ fontSize: 12, color: 'var(--accent2)' }}>⭐ {currentSet.starter} starts first</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={prevTurn} disabled={room.currentTurn === 0}>← 이전</button>
              <span style={{ padding: '6px 14px', background: 'var(--bg3)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                {room.status === 'finished' ? '완료' : `${room.currentTurn + 1} / ${currentSet.turns.length}`}
              </span>
              {room.status === 'playing' && (
                <button className="btn btn-primary btn-sm" onClick={nextTurn}>다음 →</button>
              )}
            </div>
          </div>

          {room.status === 'finished' && (
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--green-bg)', border: '1px solid #4ade8040', borderRadius: 10, color: 'var(--green)', fontSize: 14 }}>
              🎉 대화 완료! 수고했어요.
            </div>
          )}

          <FullTable set={currentSet} currentTurn={room.currentTurn} />

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={resetRound}>다른 상황 선택</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FullTable({ set, currentTurn }) {
  const cols = set.roles.length
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        {set.roles.map((r, ri) => (
          <div key={ri} style={{ padding: '14px 16px', borderRight: ri < cols - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{r.emoji}</div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.04em', marginBottom: 2 }}>{r.label}</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Turns */}
      {set.turns.map((turn, ti) => (
        <div
          key={ti}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            borderBottom: ti < set.turns.length - 1 ? '1px solid var(--border)' : 'none',
            background: ti === currentTurn ? 'var(--accent-bg)' : ti % 2 === 0 ? 'var(--bg2)' : 'var(--bg)',
            transition: 'background 0.3s',
            outline: ti === currentTurn ? '2px solid var(--accent)' : 'none',
            outlineOffset: -1
          }}
        >
          {turn.map((cell, ci) => (
            <div
              key={ci}
              style={{
                padding: '10px 14px',
                borderRight: ci < cols - 1 ? '1px solid var(--border)' : 'none',
                minHeight: 48,
                opacity: ti > currentTurn ? 0.3 : 1,
                transition: 'opacity 0.3s'
              }}
            >
              {cell && (
                <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, flexShrink: 0, paddingTop: 1 }}>{cell.icon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45 }}>{cell.text}</span>
                    {cell.from && (
                      <span style={{
                        fontSize: 10, color: 'var(--text3)',
                        background: 'var(--bg3)', border: '1px solid var(--border)',
                        borderRadius: 4, padding: '1px 5px', display: 'inline-block', width: 'fit-content'
                      }}>← {cell.from}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
