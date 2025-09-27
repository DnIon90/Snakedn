const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const USERS_FILE = path.join(__dirname,'users.json');
const SCORES_FILE = path.join(__dirname,'scores.json');
const JWT_SECRET = process.env.JWT_SECRET || 'please_change_this_secret';
const TOKEN_EXPIRES = '7d';

function readJSON(file, def){ try { return JSON.parse(fs.readFileSync(file,'utf8')||'[]'); } catch(e) { return def; } }
function writeJSON(file, data){ fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

// register
app.post('/api/register', async (req, res) => {
  const {username, password} = req.body;
  if(!username || !password) return res.status(400).json({error:'username și password necesare'});
  const users = readJSON(USERS_FILE, []);
  if(users.find(u=>u.username === username)) return res.status(400).json({error:'username folosit'});
  const hash = await bcrypt.hash(password, 10);
  const isAdmin = users.length === 0; // primul utilizator devine owner/admin
  const user = {username, passwordHash: hash, isAdmin};
  users.push(user);
  writeJSON(USERS_FILE, users);
  res.status(201).json({ok:true, isAdmin});
});

// login
app.post('/api/login', async (req,res)=>{
  const {username, password} = req.body;
  if(!username || !password) return res.status(400).json({error:'username și password necesare'});
  const users = readJSON(USERS_FILE, []);
  const user = users.find(u=>u.username === username);
  if(!user) return res.status(400).json({error:'user inexistent'});
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(400).json({error:'parolă incorectă'});
  const token = jwt.sign({username: user.username, isAdmin: !!user.isAdmin}, JWT_SECRET, {expiresIn: TOKEN_EXPIRES});
  res.json({token});
});

// submit score (protected)
app.post('/api/score', (req,res)=>{
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if(!token) return res.status(401).json({error:'token lipsă'});
  try {
    const data = jwt.verify(token, JWT_SECRET);
    const {score} = req.body;
    if(typeof score !== 'number') return res.status(400).json({error:'score invalid'});
    const scores = readJSON(SCORES_FILE, []);
    scores.push({username: data.username, score, when: new Date().toISOString(), isAdmin: !!data.isAdmin});
    scores.sort((a,b)=>b.score - a.score);
    writeJSON(SCORES_FILE, scores.slice(0,500));
    res.json({ok:true});
  } catch(e){
    return res.status(401).json({error:'token invalid'});
  }
});

// get leaderboard
app.get('/api/leaderboard', (req,res)=>{
  const scores = readJSON(SCORES_FILE, []);
  scores.sort((a,b)=>b.score - a.score);
  res.json(scores.slice(0,100));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server rulează pe', PORT));
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Servește fișierele statice (HTML, CSS, JS) din folderul public
app.use(express.static(path.join(__dirname, "public")));

// Pornire server
app.listen(PORT, () => {
  console.log(`Server pornit pe http://localhost:${PORT}`);
});