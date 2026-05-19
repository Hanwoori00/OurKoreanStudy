import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'

export default function JoinRoom() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [roomId])

  const handleJoin = async () => {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return }
    const players = room.players || {}
    if (Object.values(players).includes(name.trim())) {
      setError('이미 같은 이름이 있어요. 다른 이름을 써주세요.')
      return
    }
    if (Object.keys(players).length >= room.playerCount) {
      setError('방이 꽉 찼어요!')
      return
    }
    const pid = `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    localStorage.setItem(`pid_${roomId}`, pid)
    localStorage.setItem(`pname_${roomId}`, name.trim())
    await updateDoc(doc(db, 'rooms', roomId), {
      [`players.${pid}`]: name.trim()
    })
    navigate(`/play/${roomId}`)
  }

  if (!room) return <div className="page" style={{ color: 'var(--text3)' }}>로딩중...</div>

  const isFull = Object.keys(room.players || {}).length >= room.playerCount

  return (
    <div className="page fade-in" style={{ maxWidth: 480 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎭</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, marginBottom: 8 }}>
          {room.name}
        </h2>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <span className="tag tag-accent">{room.playerCount}인</span>
          <span className={`tag ${isFull ? 'tag-yellow' : 'tag-green'}`}>
            {isFull ? '인원 마감' : `${Object.keys(room.players || {}).length}/${room.playerCount}명 입장`}
          </span>
        </div>
      </div>

      {isFull ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text2)' }}>
          방이 꽉 찼어요. 선생님께 문의해주세요.
        </div>
      ) : (
        <div className="card">
          <label style={{ marginBottom: 10, fontSize: 14 }}>내 이름을 입력해주세요</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="예: 민준, Sarah, Alex..."
            style={{ marginBottom: 12 }}
            autoFocus
          />
          {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" onClick={handleJoin} style={{ width: '100%' }}>
            입장하기 →
          </button>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)', letterSpacing: '0.06em', marginBottom: 10 }}>
          현재 입장한 참여자
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.values(room.players || {}).map((n, i) => (
            <div key={i} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>{n}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
