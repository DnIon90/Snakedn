// FRONTEND LOGIC for SnakeDn: Snake game + auth + leaderboard
// IMPORTANT: set API_URL to your deployed backend (eg: https://snake-backend.onrender.com/api)
const API_URL = window.SNAKEDN_API_URL || 'http://localhost:3000/api'; // change after deploy

// DOM
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const authMsg = document.getElementById('auth-msg');
const welcome = document.getElementById('welcome');
const logoutBtn = document.getElementById('logout');
const startBtn = document.getElementById('start');
const submitScoreBtn = document.getElementById('submit-score');
const scoreEl = document.getElementById('score');
const leadersList = document.getElementById('leaders');
const refreshLeaders = document.getElementById('refresh-leaders');

let token = localStorage.getItem('sDn_token') || null;
let currentUser = localStorage.getItem('sDn_user') || null;
updateAuthUI();

// AUTH functions
async function register() {
  const user = usernameEl.value.trim();
  const pass = passwordEl.value;
  if(!user || !pass) return authMsg.textContent = 'Completează username și parolă';
  try {
    const r = await fetch(API_URL + '/register', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:user,password:pass})
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || 'Eroare înregistrare');
    authMsg.textContent = 'Înregistrare reușită. Te poți autentifica.';
  } catch(e) { authMsg.textContent = e.message; }
}
async function login() {
  const user = usernameEl.value.trim();
  const pass = passwordEl.value;
  if(!user || !pass) return authMsg.textContent = 'Completează username și parolă';
  try {
    const r = await fetch(API_URL + '/login', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:user,password:pass})
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || 'Eroare autentificare');
    token = j.token;
    currentUser = user;
    localStorage.setItem('sDn_token', token);
    localStorage.setItem('sDn_user', currentUser);
    authMsg.textContent = 'Autentificat!';
    updateAuthUI();
  } catch(e){ authMsg.textContent = e.message; }
}
function logout(){ token = null; currentUser = null; localStorage.removeItem('sDn_token'); localStorage.removeItem('sDn_user'); updateAuthUI(); }

function updateAuthUI(){
  if(token && currentUser){
    welcome.innerHTML = `Salut, <strong>${escapeHtml(currentUser)}</strong>`;
    logoutBtn.style.display = 'inline-block';
    submitScoreBtn.disabled = false;
  } else {
    welcome.textContent = 'Nu ești autentificat';
    logoutBtn.style.display = 'none';
    submitScoreBtn.disabled = true;
  }
}

// Leaderboard
async function loadLeaders(){
  try{
    const r = await fetch(API_URL + '/leaderboard');
    const j = await r.json();
    leadersList.innerHTML = '';
    j.slice(0,10).forEach(s=>{
      const li = document.createElement('li');
      li.textContent = `${s.username} — ${s.score} (${new Date(s.when).toLocaleString()})${s.isAdmin? ' ★':''}`;
      leadersList.appendChild(li);
    });
  }catch(e){ console.warn(e); }
}

// Submit score (requires login)
async function submitScore(score){
  if(!token) return alert('Trebuie să te autentifici.');
  try{
    const r = await fetch(API_URL + '/score', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({score})
    });
    const j = await r.json();
    if(!r.ok) throw new Error(j.error || 'Eroare trimitere scor');
    alert('Scor trimis!');
    loadLeaders();
  }catch(e){ alert('Eroare: '+e.message); }
}

// small helper
function escapeHtml(s){ return String(s||'').replace(/[&<>]/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;' })[c]); }

// Events
btnRegister.onclick = register;
btnLogin.onclick = login;
logoutBtn.onclick = logout;
refreshLeaders.onclick = loadLeaders;
submitScoreBtn.onclick = ()=> submitScore(currentScore);

// ---------- SNAKE GAME ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const grid = 20;
let snake = [{x:9,y:9}];
let dir = {x:0,y:0};
let food = null;
let gameInterval = null;
let currentScore = 0;

function resetGame(){
  snake = [{x:9,y:9}];
  dir = {x:0,y:0};
  spawnFood();
  currentScore = 0;
  scoreEl.textContent = currentScore;
  if(gameInterval) clearInterval(gameInterval);
}

function spawnFood(){
  food = {
    x: Math.floor(Math.random()* (canvas.width/grid)),
    y: Math.floor(Math.random()* (canvas.height/grid))
  };
  for(let s of snake){ if(s.x===food.x && s.y===food.y) { spawnFood(); return; } }
}

function draw(){
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(food.x*grid, food.y*grid, grid-1, grid-1);
  ctx.fillStyle = '#2ecc71';
  snake.forEach((s,i)=>{
    ctx.fillRect(s.x*grid, s.y*grid, grid-1, grid-1);
  });
}

function step(){
  const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
  if(head.x < 0 || head.x >= canvas.width / grid || head.y < 0 || head.y >= canvas.height / grid){
    return gameOver();
  }
  for(let s of snake) if(s.x === head.x && s.y === head.y) return gameOver();
  snake.unshift(head);
  if(head.x === food.x && head.y === food.y){
    currentScore += 10;
    scoreEl.textContent = currentScore;
    spawnFood();
  } else {
    snake.pop();
  }
  draw();
}

function gameOver(){
  clearInterval(gameInterval);
  gameInterval = null;
  alert('Game Over! Scor: ' + currentScore);
}

document.addEventListener('keydown', (e)=>{
  if(e.key === 'ArrowUp' && dir.y !== 1) dir = {x:0,y:-1};
  if(e.key === 'ArrowDown' && dir.y !== -1) dir = {x:0,y:1};
  if(e.key === 'ArrowLeft' && dir.x !== 1) dir = {x:-1,y:0};
  if(e.key === 'ArrowRight' && dir.x !== -1) dir = {x:1,y:0};
});

startBtn.addEventListener('click', ()=>{
  resetGame();
  if(gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(step, 100);
});

resetGame();
loadLeaders();
updateAuthUI();
