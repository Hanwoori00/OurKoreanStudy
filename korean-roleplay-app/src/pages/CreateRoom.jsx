import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { generateCardSets } from '../lib/claude'

export default function CreateRoom() {
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [playerCount, setPlayerCount] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!roomName.trim() || !prompt.trim()) {
      setError('방 이름과 프롬프트를 입력해주세요.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await generateCardSets({ prompt, playerCount })
      const docRef = await addDoc(collection(db, 'rooms'), {
        name: roomName.trim(),
        prompt,
        playerCount,
        sets: result.sets,
        status: 'waiting',
        currentSet: null,
        currentTurn: null,
        players: {},
        roles: {},
        createdAt: serverTimestamp()
      })
      navigate(`/host/${docRef.id}`)
    } catch (e) {
      console.error(e)
      setError('카드 생성 중 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page fade-in" style={{ maxWidth: 600 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 28 }}>
        ← 뒤로
      </button>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, marginBottom: 6 }}>
        새 방 만들기
      </h2>
      <p style={{ color: 'var(--text2)', marginBottom: 32 }}>
        프롬프트를 입력하면 AI가 롤플레이 카드를 만들어드려요.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label>방 이름</label>
          <input
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            placeholder="예: 초중급 월요일 수업"
          />
        </div>

        <div>
          <label>참여 인원</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2, 3, 4].map(n => (
              <button
                key={n}
                className={`btn ${playerCount === n ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPlayerCount(n)}
                style={{ flex: 1 }}
              >
                {n}명
              </button>
            ))}
          </div>
        </div>

        <div>
          <label>레벨 & 상황 프롬프트</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={`예시:\n초중급 학생들이에요. 아래 문법/표현을 사용해주세요:\n- ~할 수 있어요 / 없어요\n- ~밖에 없어요\n- ~고 싶어요\n- 잘 해요 / 잘 못해요\n\n너무 어려운 어휘는 피해주세요.`}
            style={{ minHeight: 160 }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13, padding: '10px 14px', background: '#f8717114', borderRadius: 8, border: '1px solid #f8717130' }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          onClick={handleCreate}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? (
            <>
              <span className="spinner" />
              AI가 카드를 만들고 있어요...
            </>
          ) : (
            '🎴 방 만들기 & 카드 생성'
          )}
        </button>
      </div>
    </div>
  )
}
