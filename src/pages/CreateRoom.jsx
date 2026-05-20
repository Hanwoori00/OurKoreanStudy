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
      
      // AI 데이터 구조 검증 구조 추가 (방어적 코드)
      if (!result || !result.sets || !Array.isArray(result.sets)) {
        throw new Error('INVALID_SCHEMA');
      }

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
      console.error("Error Detail:", e);
      
      // 어떤 에러냐에 따라 사용자에게 친절하고 명확한 가이드 제공
      if (e.message.includes('API_ERROR:504') || e.message.includes('API_ERROR:502')) {
        setError('AI 응답 시간이 초과되었습니다. 조금 더 간결한 프롬프트로 다시 시도해 주세요.');
      } else if (e.message === 'JSON_PARSE_FAILED' || e.message === 'INVALID_SCHEMA') {
        setError('AI가 데이터 형식을 맞추지 못했습니다. 한 번 더 [방 만들기]를 눌러주세요.');
      } else {
        setError('카드 생성 중 오류가 발생했어요. 다시 시도해주세요.');
      }
    } finally {
      /* 타임아웃 현상이 발생했을 때 Vercel 서버는 죽어도 클로드는 백엔드에서 생성을 계속할 수 있습니다.
       바로 재시도하면 클로드가 이전 요청을 처리하느라 부하가 생길 수 있으므로 
       실패 후 재시도 버튼 활성화 전 미세한 텀을 주거나 무겁지 않게 관리하는 것이 좋습니다.
      */
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
              AI가 카드를 만들고 있어요 (최대 10초)...
            </>
          ) : (
            '🎴 방 만들기 & 카드 생성'
          )}
        </button>
      </div>
    </div>
  )
}
