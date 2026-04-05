/**
 * Burke CEO Command Center — Browser Bookmarklet
 *
 * To install: Copy the minified version below and save it as a browser bookmark.
 * When clicked on any page, it sends the selected text + page URL to your dashboard.
 *
 * Replace YOUR_DOMAIN and YOUR_WEBHOOK_KEY with your actual values.
 */

// ── FULL VERSION (for reading/editing) ──────────────────────────────────────
javascript:(function(){
  var domain  = 'https://YOUR_DOMAIN.railway.app';
  var apiKey  = 'YOUR_WEBHOOK_KEY';
  var sel     = window.getSelection ? window.getSelection().toString() : '';
  var title   = prompt('Task title:', sel.slice(0,100) || document.title);
  if (!title) return;
  var note    = prompt('Notes (optional):');
  var payload = {
    type:          'task',
    title:         title,
    description:   note || '',
    sourceUrl:     window.location.href,
    sourceContext: sel.slice(0,500),
    source:        'browser',
    priority:      'p2'
  };
  fetch(domain + '/api/webhook', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body:    JSON.stringify(payload)
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if (d.id) alert('✓ Task created in Burke CEO Dashboard!');
    else alert('Error: ' + JSON.stringify(d));
  })
  .catch(function(e){ alert('Could not reach dashboard: ' + e.message); });
})();
