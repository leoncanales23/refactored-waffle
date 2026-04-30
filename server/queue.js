// queue.js — Cola simple en memoria para renders NERHIA
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const QUEUE_FILE = path.join(__dirname, '../tmp/queue.json');

class RenderQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.running = false;
    this.maxConcurrent = 1;
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(QUEUE_FILE)) {
        const raw = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
        raw.forEach(j => { if (j.status === 'pending') this.jobs.set(j.id, j); });
        console.log(`[Queue] ${this.jobs.size} jobs pendientes restaurados`);
      }
    } catch (_) {}
  }

  _save() {
    try {
      fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
      fs.writeFileSync(QUEUE_FILE, JSON.stringify([...this.jobs.values()], null, 2));
    } catch (_) {}
  }

  add(metrics, webhookUrl, notifyEmail) {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const job = { id, metrics, webhookUrl: webhookUrl || null, notifyEmail: notifyEmail || null, status: 'pending', createdAt: new Date().toISOString(), startedAt: null, finishedAt: null, outputPath: null, error: null };
    this.jobs.set(id, job);
    this._save();
    this.emit('added', job);
    return job;
  }

  get(id) { return this.jobs.get(id) || null; }

  list() { return [...this.jobs.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }

  update(id, patch) {
    const job = this.jobs.get(id);
    if (!job) return;
    Object.assign(job, patch);
    this.jobs.set(id, job);
    this._save();
    this.emit('updated', job);
  }

  remove(id) { this.jobs.delete(id); this._save(); }

  stats() {
    const all = this.list();
    return { total: all.length, pending: all.filter(j => j.status === 'pending').length, running: all.filter(j => j.status === 'running').length, done: all.filter(j => j.status === 'done').length, failed: all.filter(j => j.status === 'failed').length };
  }
}

module.exports = new RenderQueue();