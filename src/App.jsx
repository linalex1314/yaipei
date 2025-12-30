
import { useEffect, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components';
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import emailjs from 'emailjs-com'

const GlobalStyle = createGlobalStyle`
  :root{
    --bg: #f5f7fb;
    --text: #1f2937;
    --muted: #6b7280;
    --accent1: #ffb4c4; /* about */
    --accent2: #9fe8f6; /* portfolio */
    --accent3: #fff3bf; /* contact */
    --card: #ffffff;
    --primary: linear-gradient(90deg,#6a11cb,#2575fc);
  }
  html {
    scroll-behavior: smooth;
    box-sizing: border-box;
  }
  *,*::before,*::after{box-sizing:inherit}
  body {
    margin: 0;
    display: block;
    width: 100%;
    overflow-x: hidden;
    font-family: 'Noto Sans TC', 'Segoe UI', Roboto, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  h2{font-size:2rem;margin:0 0 .6rem}
  p{color:var(--muted)}
  button{
    background: var(--card);
    border: 1px solid rgba(0,0,0,0.08);
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  button:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(16,24,40,.08)}
  input, textarea{padding:8px;border-radius:6px;border:1px solid rgba(0,0,0,0.08)}
  .card{background:var(--card);border-radius:10px;padding:1rem;box-shadow:0 6px 18px rgba(16,24,40,.04)}
  /* modal backdrop */
  .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:300}
`;

const ProgressWrap = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: transparent;
  z-index: 400;
`;
const ProgressBar = styled.div`
  height: 4px;
  width: ${props => props.width || '0%'};
  background: var(--primary);
  box-shadow: 0 2px 8px rgba(37,117,252,.2);
  transition: width 120ms linear;
`;

// Quill toolbar and formats (包含字體大小、顏色、段落對齊、清單等基本功能)
const quillModules = {
  toolbar: [
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['clean']
  ]
}
const quillFormats = [
  'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'bullet', 'align', 'clean'
]

const Nav = styled.nav`
  width: 100%;
  background: #222;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
`;
const NavList = styled.ul`
  display: flex;
  justify-content: flex-end;
  margin: 0;
  padding: 0;
  list-style: none;
  padding-right: 2rem;

  @media (max-width: 900px) {
    justify-content: center;
    padding-right: 0;
  }
`;
const NavItem = styled.li`
  margin: 0 1.5rem;
  padding: 1rem 0;
  cursor: pointer;
  font-weight: bold;
  &:hover {
    color: #ffb347;
  }
`;
const Section = styled.section`
  width: 100%;
  min-height: 100vh;
  padding: 4rem 0 2rem 0; /* 背景滿版，內部由 ContentInner 控制內距 */
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  @media (max-width: 600px) {
    padding: 3rem 0.5rem 1rem 0.5rem;
  }
`;

const ContentInner = styled.div`
  width: 100%;
  padding: 0 2rem; /* 桌面使用側邊內距，但內容不置中，滿版顯示 */
  @media (max-width: 900px) {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem;
  }
`;

function App() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [editing, setEditing] = useState(null) // 'about' | 'portfolio' | 'contact' | null

  const [content, setContent] = useState({
    about: '<p>這裡是自我介紹區塊，請點編輯以修改內容。</p>',
    portfolio: '<p>這裡會顯示你的作品集相簿。</p>',
    contact: '<p>這裡是聯絡資訊與表單區塊。</p>'
  })

  const [albums, setAlbums] = useState([])
  const [showAlbumForm, setShowAlbumForm] = useState(false)
  const [albumTitle, setAlbumTitle] = useState('')
  const [albumDesc, setAlbumDesc] = useState('')
  const [albumFiles, setAlbumFiles] = useState([]) // base64 strings
  const [viewingAlbum, setViewingAlbum] = useState(null) // album id
  const [viewIndex, setViewIndex] = useState(0)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('yaipei_content')
    if (raw) {
      try {
        setContent(JSON.parse(raw))
      } catch (e) {
        // ignore
      }
    }
    const rawAlbums = localStorage.getItem('yaipei_albums')
    if (rawAlbums) {
      try {
        setAlbums(JSON.parse(rawAlbums))
      } catch (e) {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const pct = docHeight > 0 ? Math.round((scrolled / docHeight) * 100) : 0
      setScrollProgress(pct)
    }
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // 相簿輪播自動播放（在 modal 開啟時啟動）
  useEffect(() => {
    if (!viewingAlbum) return
    const t = setInterval(() => {
      nextImage()
    }, 3500)
    return () => clearInterval(t)
  }, [viewingAlbum, albums])

  const saveContent = (next) => {
    const merged = { ...content, ...next }
    setContent(merged)
    localStorage.setItem('yaipei_content', JSON.stringify(merged))
    setEditing(null)
  }

  const persistAlbums = (next) => {
    setAlbums(next)
    localStorage.setItem('yaipei_albums', JSON.stringify(next))
  }

  const filesToBase64 = (fileList) => {
    const files = Array.from(fileList)
    return Promise.all(files.map(file => new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => res(reader.result)
      reader.onerror = rej
      reader.readAsDataURL(file)
    })))
  }

  const handleAlbumFiles = async (e) => {
    const list = e.target.files
    if (!list || list.length === 0) return
    const base64s = await filesToBase64(list)
    setAlbumFiles(prev => [...prev, ...base64s])
  }

  const createAlbum = () => {
    if (!albumTitle) {
      alert('請輸入相簿標題')
      return
    }
    const id = Date.now().toString()
    const newAlbum = { id, title: albumTitle, description: albumDesc, images: albumFiles }
    const next = [newAlbum, ...albums]
    persistAlbums(next)
    setAlbumTitle('')
    setAlbumDesc('')
    setAlbumFiles([])
    setShowAlbumForm(false)
  }

  const openAlbum = (id, start = 0) => {
    setViewingAlbum(id)
    setViewIndex(start)
  }

  const updateAlbum = (id, patch) => {
    const next = albums.map(a => a.id === id ? { ...a, ...patch } : a)
    persistAlbums(next)
  }

  const addImagesToAlbum = async (id, fileList) => {
    if (!fileList || fileList.length === 0) return
    const base64s = await filesToBase64(fileList)
    const next = albums.map(a => a.id === id ? { ...a, images: [...(a.images||[]), ...base64s] } : a)
    persistAlbums(next)
  }

  const deleteImageFromAlbum = (id, idx) => {
    const next = albums.map(a => {
      if (a.id !== id) return a
      const images = (a.images || []).filter((_, i) => i !== idx)
      return { ...a, images }
    })
    persistAlbums(next)
    if (viewingAlbum === id) {
      const cur = next.find(x => x.id === id)
      if (!cur || (cur.images||[]).length === 0) {
        setViewIndex(0)
      } else {
        setViewIndex(i => Math.min(i, (cur.images||[]).length - 1))
      }
    }
  }

  const closeAlbum = () => {
    setViewingAlbum(null)
    setViewIndex(0)
  }

  const nextImage = () => {
    const album = albums.find(a => a.id === viewingAlbum)
    if (!album) return
    setViewIndex((i) => (i + 1) % album.images.length)
  }

  const prevImage = () => {
    const album = albums.find(a => a.id === viewingAlbum)
    if (!album) return
    setViewIndex((i) => (i - 1 + album.images.length) % album.images.length)
  }

  const sendContact = async (e) => {
    e.preventDefault()
    const { name, email, message } = contactForm
    if (!name || !email || !message) {
      alert('請填寫姓名、Email 與內容')
      return
    }
    setSending(true)
    try {
      await emailjs.send(
        'YOUR_SERVICE_ID', // replace with your EmailJS service ID
        'YOUR_TEMPLATE_ID', // replace with your EmailJS template ID
        { from_name: name, from_email: email, message: message },
        'YOUR_USER_ID' // replace with your EmailJS user ID / public key
      )
      alert('郵件已送出，感謝聯絡！')
      setContactForm({ name: '', email: '', message: '' })
    } catch (err) {
      console.error(err)
      alert('寄信失敗，請稍後再試')
    } finally {
      setSending(false)
    }
  }

  const tryLogin = () => {
    if (password === 'yaipeiBB') {
      setIsAdmin(true)
      setShowLogin(false)
      setPassword('')
    } else {
      alert('密碼錯誤')
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <GlobalStyle />
      <ProgressWrap>
        <ProgressBar width={`${scrollProgress}%`} />
      </ProgressWrap>
      <Nav>
        <NavList>
          <NavItem onClick={() => scrollTo('about')}>關於我</NavItem>
          <NavItem onClick={() => scrollTo('portfolio')}>作品集</NavItem>
          <NavItem onClick={() => scrollTo('contact')}>聯絡我</NavItem>
        </NavList>
      </Nav>

      <div style={{ textAlign: 'right', padding: '0.5rem 1rem' }}>
        {isAdmin ? (
          <button onClick={() => { setIsAdmin(false) }}>登出後台</button>
        ) : (
          <button onClick={() => setShowLogin(true)}>後台登入</button>
        )}
      </div>

      {showLogin && !isAdmin && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 320 }}>
            <h3>後台登入</h3>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="請輸入密碼" style={{ width: '100%', padding: 8 }} />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowLogin(false)}>取消</button>
              <button onClick={tryLogin}>登入</button>
            </div>
          </div>
        </div>
      )}

      <Section id="about" style={{ background: 'var(--accent1)' }}>
        <ContentInner>
          <h2>關於我</h2>
          <div dangerouslySetInnerHTML={{ __html: content.about }} style={{ textAlign: 'left' }} />
          {isAdmin && <div style={{ marginTop: 12 }}><button onClick={() => setEditing('about')}>編輯</button></div>}
        {editing === 'about' && (
          <div style={{ width: '100%', maxWidth: 900, marginTop: 16 }}>
            <ReactQuill modules={quillModules} formats={quillFormats} theme="snow" value={content.about} onChange={v => setContent(prev => ({ ...prev, about: v }))} />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)}>取消</button>
              <button onClick={() => saveContent({ about: content.about })}>儲存</button>
            </div>
          </div>
        )}
        </ContentInner>
      </Section>

      <Section id="portfolio" style={{ background: 'var(--accent2)' }}>
        <ContentInner>
          <h2>作品集</h2>
          <div style={{ textAlign: 'left' }}>{/* 保留 portfolio 文字說明 */}
            <span dangerouslySetInnerHTML={{ __html: content.portfolio }} />
          </div>

          {isAdmin && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowAlbumForm(s => !s)}>{showAlbumForm ? '取消新增相簿' : '新增相簿'}</button>
              <button onClick={() => { if (confirm('清空所有相簿？')) { persistAlbums([]) } }}>清空相簿</button>
            </div>
          )}

          {showAlbumForm && isAdmin && (
            <div style={{ marginTop: 12, background: '#fff', padding: 12, borderRadius: 8 }}>
              <input placeholder="相簿標題" value={albumTitle} onChange={e => setAlbumTitle(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
              <div style={{ marginBottom: 8 }}>
                <ReactQuill modules={quillModules} formats={quillFormats} theme="snow" value={albumDesc} onChange={v => setAlbumDesc(v)} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <input type="file" multiple accept="image/*" onChange={handleAlbumFiles} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>{albumFiles.map((f, idx) => (<img key={idx} src={f} alt="preview" style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 4 }} />))}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowAlbumForm(false); setAlbumFiles([]); setAlbumTitle(''); setAlbumDesc('') }}>取消</button>
                <button onClick={createAlbum}>建立相簿</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
            {albums.length === 0 && (<div style={{ padding: 20, background: '#fff', borderRadius: 8 }}>目前沒有任何相簿</div>)}
            {albums.map(album => (
              <div key={album.id} style={{ background: '#fff', padding: 12, borderRadius: 8, cursor: 'pointer' }} onClick={() => openAlbum(album.id, 0)}>
                <div style={{ height: 140, borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ddd' }}>
                  {album.images && album.images.length > 0 ? (
                    <img src={album.images[0]} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ padding: 12 }}>無圖片</div>
                  )}
                </div>
                <h4 style={{ margin: '8px 0 4px 0' }}>{album.title}</h4>
                <div style={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: album.description }} />
              </div>
            ))}
          </div>
        </ContentInner>

        {/* Album Modal */}
        {viewingAlbum && (() => {
          const a = albums.find(x => x.id === viewingAlbum)
          if (!a) return null
          return (
            <div className="modal-backdrop" onClick={closeAlbum}>
              <div style={{ width: '94%', maxWidth: 980, background: '#fff', borderRadius: 8, padding: 12, position: 'relative' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>{a.title}</h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {isAdmin && <button onClick={() => { if (confirm('刪除此相簿？')) { persistAlbums(albums.filter(x => x.id !== a.id)); closeAlbum() } }}>刪除相簿</button>}
                    <button onClick={closeAlbum}>關閉</button>
                  </div>
                </div>

                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
                    <button onClick={prevImage} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>‹</button>
                    {a.images && a.images.length > 0 ? (
                      <img src={a.images[viewIndex]} alt={`img-${viewIndex}`} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 6 }} />
                    ) : (
                      <div style={{ padding: 20 }}>此相簿無圖片</div>
                    )}
                    <button onClick={nextImage} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>›</button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 4px' }}>
                    {(a.images || []).map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', flex: '0 0 auto', cursor: 'pointer' }} onClick={() => setViewIndex(idx)}>
                        <img src={img} alt={`thumb-${idx}`} style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6, border: idx === viewIndex ? '3px solid #2575fc' : '2px solid rgba(0,0,0,0.06)' }} />
                        {isAdmin && <button onClick={(e) => { e.stopPropagation(); if (confirm('刪除此圖片？')) deleteImageFromAlbum(a.id, idx) }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)', borderRadius: 999 }}>✕</button>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: a.description }} />
                    {isAdmin && (
                      <div style={{ width: 320 }} className="card">
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', marginBottom: 6 }}>編輯標題</label>
                          <input defaultValue={a.title} onBlur={e => updateAlbum(a.id, { title: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', marginBottom: 6 }}>編輯描述</label>
                          <ReactQuill modules={quillModules} formats={quillFormats} theme="snow" value={a.description} onChange={v => updateAlbum(a.id, { description: v })} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', marginBottom: 6 }}>新增圖片</label>
                          <input type="file" multiple accept="image/*" onChange={e => addImagesToAlbum(a.id, e.target.files)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </Section>

      <Section id="contact" style={{ background: 'var(--accent3)' }}>
        <ContentInner>
          <h2>聯絡我</h2>
          <div dangerouslySetInnerHTML={{ __html: content.contact }} style={{ textAlign: 'left' }} />
          {isAdmin && <div style={{ marginTop: 12 }}><button onClick={() => setEditing('contact')}>編輯</button></div>}
        {editing === 'contact' && (
          <div style={{ width: '100%', maxWidth: 900, marginTop: 16 }}>
            <ReactQuill modules={quillModules} formats={quillFormats} theme="snow" value={content.contact} onChange={v => setContent(prev => ({ ...prev, contact: v }))} />
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)}>取消</button>
              <button onClick={() => saveContent({ contact: content.contact })}>儲存</button>
            </div>
          </div>
        )}

        {/* 聯絡表單 */}
        <div style={{ width: '100%', maxWidth: 900, marginTop: 20 }} className="card">
          <form onSubmit={sendContact}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input placeholder="姓名" value={contactForm.name} onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))} />
              <input placeholder="Email" type="email" value={contactForm.email} onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))} />
            </div>
            <div style={{ marginTop: 12 }}>
              <textarea placeholder="訊息內容" rows={6} style={{ width: '100%' }} value={contactForm.message} onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))} />
            </div>
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="reset" onClick={() => setContactForm({ name: '', email: '', message: '' })}>清除</button>
              <button type="submit" disabled={sending}>{sending ? '寄信中...' : '送出'}</button>
            </div>
          </form>
        </div>
        </ContentInner>
      </Section>
    </>
  );
}

export default App;
