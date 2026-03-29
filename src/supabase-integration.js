// ============================================================
// supabase-integration.js
// Brothers Thekkepuram Club — Supabase Connection
//
// HOW TO USE:
// 1. Go to supabase.com → your project → Settings → API
// 2. Copy "Project URL" and "anon public" key
// 3. Paste them below
// 4. Import { db } from './supabase-integration' in App.js
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';   // ← paste here
const SUPABASE_KEY  = 'YOUR_ANON_PUBLIC_KEY';                   // ← paste here

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── AUTH ──────────────────────────────────────────────────────────────────────

// Login: fetch member by phone, verify PIN client-side
export async function loginWithPhone(phone, pin) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', phone)
    .eq('active', true)
    .single();

  if (error || !data) return { error: 'Phone number not registered.' };
  if (data.pin !== pin) return { error: 'Wrong PIN. Try again.' };
  return { user: data };
}

// ── MEMBERS ───────────────────────────────────────────────────────────────────

export async function getMembers() {
  const { data } = await supabase.from('members').select('*').order('created_at');
  return data || [];
}

export async function addMember(member) {
  const { data, error } = await supabase.from('members').insert([member]).select().single();
  if (error) throw error;
  // Create fee rows for all 12 months of current year
  const year = new Date().getFullYear();
  const feeRows = Array.from({length:12}, (_,i) => ({
    member_id: data.id, year, month: i, paid: false
  }));
  await supabase.from('fees').insert(feeRows);
  return data;
}

export async function updateMember(id, updates) {
  const { data, error } = await supabase.from('members').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function bulkAddMembers(members) {
  const results = [];
  for (const m of members) {
    try { results.push(await addMember(m)); } catch(e) { /* skip duplicate */ }
  }
  return results;
}

// ── FEES ──────────────────────────────────────────────────────────────────────

export async function getFees(year) {
  const { data } = await supabase.from('fees').select('*').eq('year', year);
  // Convert to { memberId: { "year-month": bool } } format the app uses
  const map = {};
  (data||[]).forEach(f => {
    if (!map[f.member_id]) map[f.member_id] = {};
    map[f.member_id][`${f.year}-${f.month}`] = f.paid;
  });
  return map;
}

export async function toggleFee(memberId, year, month, paid) {
  const { error } = await supabase.from('fees')
    .upsert({ member_id: memberId, year, month, paid }, { onConflict: 'member_id,year,month' });
  if (error) throw error;
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────────

export async function getPayments() {
  const { data } = await supabase.from('payments').select('*').order('submitted_at', { ascending: false });
  return data || [];
}

export async function submitPayment(payment, screenshotFile) {
  let screenshot_url = payment.screenshot_url || null;

  if (screenshotFile) {
    try {
      // Try storage bucket first
      const filename = `${Date.now()}_${screenshotFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('screenshots').upload(filename, screenshotFile);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(filename);
        screenshot_url = urlData.publicUrl;
      } else {
        // Fallback: store as base64 directly in DB
        screenshot_url = await fileToBase64(screenshotFile);
      }
    } catch(e) {
      try { screenshot_url = await fileToBase64(screenshotFile); } catch(e2) {}
    }
  }

  const { screenshot_url: _ignore, ...paymentData } = payment;
  const { data, error } = await supabase.from('payments')
    .insert([{ ...paymentData, screenshot_url }]).select().single();
  if (error) throw error;
  return data;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


export async function approvePayment(paymentId, reviewerName, memberId, year, month) {
  // Mark payment approved
  await supabase.from('payments').update({
    status: 'approved',
    reviewed_by: reviewerName,
    reviewed_at: new Date().toISOString()
  }).eq('id', paymentId);

  // Auto-mark fee as paid
  await toggleFee(memberId, year, month, true);
}

export async function rejectPayment(paymentId, reviewerName) {
  await supabase.from('payments').update({
    status: 'rejected',
    reviewed_by: reviewerName,
    reviewed_at: new Date().toISOString()
  }).eq('id', paymentId);
}

// ── INCOME ────────────────────────────────────────────────────────────────────

export async function getIncome() {
  const { data } = await supabase.from('income').select('*').order('date', { ascending: false });
  return data || [];
}

export async function addIncome(entry) {
  const { data, error } = await supabase.from('income').insert([entry]).select().single();
  if (error) throw error;
  return data;
}

export async function updateIncome(id, updates) {
  const { data, error } = await supabase.from('income').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteIncome(id) {
  const { error } = await supabase.from('income').delete().eq('id', id);
  if (error) throw error;
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────

export async function getExpenses() {
  const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  return data || [];
}

export async function addExpense(entry) {
  const { data, error } = await supabase.from('expenses').insert([entry]).select().single();
  if (error) throw error;
  return data;
}

export async function updateExpense(id, updates) {
  const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ── EVENTS ────────────────────────────────────────────────────────────────────

export async function getEvents() {
  const { data } = await supabase.from('events').select('*, attendance(member_id, going)').order('date');
  return (data||[]).map(e => ({
    ...e,
    rsvp: Object.fromEntries((e.attendance||[]).map(a => [a.member_id, a.going]))
  }));
}

export async function addEvent(event) {
  const { data, error } = await supabase.from('events').insert([event]).select().single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  await supabase.from('events').delete().eq('id', id);
}

export async function toggleAttendance(eventId, memberId, going) {
  await supabase.from('attendance')
    .upsert({ event_id: eventId, member_id: memberId, going }, { onConflict: 'event_id,member_id' });
}

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────

export async function getAnnouncements() {
  const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function addAnnouncement(ann) {
  const { data, error } = await supabase.from('announcements').insert([ann]).select().single();
  if (error) throw error;
  return data;
}

export async function togglePinAnnouncement(id, pinned) {
  await supabase.from('announcements').update({ pinned }).eq('id', id);
}

export async function deleteAnnouncement(id) {
  await supabase.from('announcements').delete().eq('id', id);
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

export async function getSettings() {
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
  return data;
}

export async function saveSettings(updates) {
  // QR images are already base64 strings in updates.gpay_qr_url / upi_qr_url
  // They get stored directly in the DB text column — no storage bucket needed
  const { data, error } = await supabase.from('settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1).select().single();
  if (error) throw error;
  return data;
}

// ── REAL-TIME SUBSCRIPTIONS ───────────────────────────────────────────────────
// Use these in App.js useEffect to get live updates

export function subscribeToPayments(callback) {
  return supabase.channel('payments_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, callback)
    .subscribe();
}

export function subscribeToFees(callback) {
  return supabase.channel('fees_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'fees' }, callback)
    .subscribe();
}

export function subscribeToAnnouncements(callback) {
  return supabase.channel('ann_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, callback)
    .subscribe();
}

// ── HOW TO USE IN App.js ──────────────────────────────────────────────────────
//
// 1. Install: npm install @supabase/supabase-js
//
// 2. In App.js, replace useState initial data with useEffect loaders:
//
//    useEffect(() => {
//      getMembers().then(setMembers);
//      getFees(2026).then(setFees);
//      getExpenses().then(setExpenses);
//      getIncome().then(setIncome);
//      getPayments().then(setPayments);
//      getEvents().then(setEvents);
//      getAnnouncements().then(setAnn);
//      getSettings().then(setSettings);
//    }, []);
//
// 3. Replace each local state mutation with a Supabase call + re-fetch:
//
//    // Instead of: setMembers(p => [...p, newMember])
//    // Do:
//    await addMember(newMember);
//    getMembers().then(setMembers);
//
// 4. For real-time (optional but impressive):
//
//    useEffect(() => {
//      const sub = subscribeToPayments(() => getPayments().then(setPayments));
//      return () => sub.unsubscribe();
//    }, []);
//
// ============================================================
