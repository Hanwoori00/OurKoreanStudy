import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../lib/firebase'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'

export default function PlayerRoom() {
  const { roomId } = useParams()
  const [room, setRoom] = useState(null)
  const pid = localStorage.getItem(`pid_${roomId}`)
  const pname = localStorage.getItem(`pname_${roomId}`)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [roomId])

  const selectRole = async (roleName) => {
    const roles = room.roles || {}
    // check not taken
    if (roles[roleName] && roles[roleName] !== pid) return
    const newRoles = { ...roles }
    // deselect previous role
    Object.keys(newRoles).forEach(k => { if (newRoles[k] === pid) delete newRoles[k] })
    newRoles[roleName] = pid
    await updateDoc(doc(db, 'rooms', roomId), { roles: newRoles })
  }

  if (!room) return <Loading />

  const currentSet = room.currentSet != null ? room.sets[room.currentSet] : null
  const roles = room.roles || {}
  const players = room.players || {}

  // My assigned role
  const myRoleEntry = Object.entries(roles).find(([, id]) => id === pid)
  const myRoleName = myRoleEntry ? myRoleEntry[0] : null
  const myRole = currentSet?.roles.find(r => r.name === myRoleName)
  const myRoleIdx = currentSet?.roles.findIndex(r => r.name === myRoleName) ?? -1

  // Waiting for game to start
  if (room.status === 'waiting') {
    return (
      <div className="page fade-in" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 24, marginBottom: 8 }}>대기 중</h2>
        <p style={{ color: 'var(--text2)', marginBottom: 24 }}>선생님이 상황을 선택할 때까지 기다려주세요.</p>
        <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '10px 20px', display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {pname}
        </div>
      </div>
    )
  }

  // Role selection
  if ((room.status === 'selecting') && currentSet) {
    return (
      <div className="page fade-in" style={{ maxWidth: 480 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>상황</div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{currentSet.title}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{currentSet.situation}</div>
          <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--accent-bg)', borderRadius: 8, fontSize: 12, color: 'var(--accent2)' }}>
            ⭐ {currentSet.starter} starts first
          </div>
        </div>

        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em', marginBottom: 12 }}>
          역할을 선택해주세요
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentSet.roles.map((role, ri) => {
            const assignedPid = roles[role.name]
            const assignedName = assignedPid ? players[assignedPid] : null
            const isMyRole = myRoleName === role.name
            const isTaken = assignedPid && assignedPid !== pid

            return (
              <button
                key={ri}
                className="card"
                onClick={() => !isTaken && selectRole(role.name)}
                style={{
                  textAlign: 'left', cursor: isTaken ? 'not-allowed' : 'pointer',
                  border: isMyRole ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isMyRole ? 'var(--accent-bg)' : isTaken ? 'var(--bg)' : 'var(--bg2)',
                  opacity: isTaken ? 0.5 : 1,
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: 22 }}>{role.emoji}</span>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)', marginTop: 4 }}>{role.label}</div>
                    <div style={{ fontWeight: 500, marginBottom: 3 }}>{role.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{role.desc}</div>
                  </div>
                  <div>
                    {isMyRole && <span className="tag tag-accent">내 역할 ✓</span>}
                    {isTaken && <span className="tag tag-yellow">{assignedName}</span>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {myRoleName && (
          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--green-bg)', border: '1px solid #4ade8040', borderRadius: 10, fontSize: 13, color: 'var(--green)' }}>
            ✓ <strong>{myRoleName}</strong> 역할을 선택했어요. 선생님이 시작하면 게임이 시작돼요!
          </div>
        )}
      </div>
    )
  }

  // Playing - show one turn at a time
  if ((room.status === 'playing' || room.status === 'finished') && currentSet) {
    const currentTurn = room.currentTurn ?? 0
    const turn = currentSet.turns[currentTurn]
    const myCell = myRoleIdx >= 0 ? turn[myRoleIdx] : null
    const isFinished = room.status === 'finished'

    return (
      <div className="page fade-in" style={{ maxWidth: 480 }}>
        {/* My role badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          {myRole && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px' }}>
              <span style={{ fontSize: 20 }}>{myRole.emoji}</span>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>나의 역할</div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{myRole.name}</div>
              </div>
            </div>
          )}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>
            {isFinished ? '완료' : `${currentTurn + 1} / ${currentSet.turns.length}`}
          </span>
        </div>

        {isFinished ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300 }}>수고했어요!</div>
            <div style={{ color: 'var(--text2)', marginTop: 8 }}>대화가 끝났어요.</div>
          </div>
        ) : (
          <>
            {/* Current turn card */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em', marginBottom: 12 }}>
                지금 이 순간
              </div>

              {/* All roles this turn */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentSet.roles.map((role, ri) => {
                  const cell = turn[ri]
                  const isMe = ri === myRoleIdx
                  if (!cell) return null
                  return (
                    <div
                      key={ri}
                      style={{
                        border: isMe ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: isMe ? 'var(--accent-bg)' : 'var(--bg2)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16 }}>{role.emoji}</span>
                        <span style={{ fontWeight: 500, fontSize: 13 }}>{role.name}</span>
                        {isMe && <span className="tag tag-accent" style={{ marginLeft: 'auto' }}>나</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{cell.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, lineHeight: 1.5, color: isMe ? 'var(--text)' : 'var(--text2)' }}>{cell.text}</div>
                          {cell.from && (
                            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text3)', background: 'var(--bg3)', display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
                              ← {cell.from}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* If nothing for this role this turn */}
                {myCell === null && myRoleIdx >= 0 && (
                  <div style={{ border: '1px dashed var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                    이번 턴은 다른 사람의 차례예요. 잘 들어보세요! 👂
                  </div>
                )}
              </div>
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 24 }}>
              {currentSet.turns.map((_, ti) => (
                <div
                  key={ti}
                  style={{
                    width: ti === currentTurn ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: ti === currentTurn ? 'var(--accent)' : ti < currentTurn ? 'var(--border2)' : 'var(--border)',
                    transition: 'all 0.3s'
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return <Loading />
}

function Loading() {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, marginBottom: 12 }} />
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>로딩중...</div>
      </div>
    </div>
  )
}
