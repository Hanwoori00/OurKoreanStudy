import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

export default function Home() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const activeRooms = rooms.filter(r => r.status !== 'closed')

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 300, color: 'var(--text)' }}>
            한국어 롤플레이
          </h1>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>roleplay rooms</span>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          AI가 만드는 한국어 대화 카드 게임
        </p>
      </div>

      <button className="btn btn-primary btn-lg" onClick={() => navigate('/create')} style={{ marginBottom: 40 }}>
        + 방 만들기
      </button>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
            OPEN ROOMS
          </span>
          <span className="tag tag-green">{activeRooms.length}</span>
        </div>

        {activeRooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎭</div>
            <div>아직 열린 방이 없어요. 첫 번째로 만들어보세요!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeRooms.map(room => (
              <div key={room.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{room.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="tag tag-accent">{room.playerCount}인</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                      참여자 {room.players ? Object.keys(room.players).length : 0}명
                    </span>
                    <span className={`tag ${room.status === 'waiting' ? 'tag-yellow' : 'tag-green'}`}>
                      {room.status === 'waiting' ? '대기중' : room.status === 'playing' ? '진행중' : room.status}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/join/${room.id}`)}
                >
                  참여하기 →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
