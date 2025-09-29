// Supabase inicializálása
const supabaseUrl = 'https://vzsfduzrjycgogmjnyuy.supabase.co';
// FIGYELEM: Az anon kulcsot ne tedd éles frontendbe! Használj RLS-t!
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6c2ZkdXpyanljZ29nbWpueXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMzAxMzEsImV4cCI6MjA3NDcwNjEzMX0.LA_QKXmUzVlqR318USt2Gp0TWdB00ojfmf9fg8_k3IY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM elemek
const messageForm = document.getElementById('messageForm');
const nameInput = document.getElementById('name');
const messageInput = document.getElementById('message');
const feedback = document.getElementById('feedback');
const messagesList = document.getElementById('messagesList');

// IP cím lekérése egyszer oldalbetöltéskor
let ip_address = '';
fetch('https://api64.ipify.org?format=json')
  .then(res => res.json())
  .then(data => ip_address = data.ip)
  .catch(err => console.warn('IP lekérés sikertelen:', err));

// Üzenetek betöltése
async function loadMessages() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    messagesList.innerHTML = '';

    if (error) {
      console.error('Hiba az üzenetek lekérésekor:', error);
      messagesList.innerHTML = '<p>Nem sikerült betölteni az üzeneteket.</p>';
      return;
    }

    if (!data.length) {
      messagesList.innerHTML = '<p>Még nincsenek üzenetek.</p>';
      return;
    }

    data.forEach(msg => {
      const div = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = msg.name;

      const date = document.createElement('small');
      date.textContent = new Date(msg.created_at).toLocaleString('hu-HU');

      const p = document.createElement('p');
      p.textContent = msg.message;

      div.appendChild(name);
      div.appendChild(date);
      div.appendChild(document.createElement('br'));
      div.appendChild(p);

      messagesList.appendChild(div);
    });
  } catch (err) {
    console.error('Hiba:', err);
    messagesList.innerHTML = '<p>Hiba történt az üzenetek betöltésekor.</p>';
  }
}

// Üzenet beküldése
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  feedback.textContent = '';
  feedback.className = 'feedback';

  if (name.length < 2 || message.length < 2) {
    feedback.textContent = 'Túl rövid név vagy üzenet.';
    feedback.classList.add('error');
    return;
  }

  try {
    const { error } = await supabase
      .from('messages')
      .insert([{ name, message, ip_address }]);

    if (error) {
      feedback.textContent = 'Hiba: ' + error.message;
      feedback.classList.add('error');
    } else {
      feedback.textContent = 'Üzenet elküldve!';
      nameInput.value = '';
      messageInput.value = '';
      nameInput.focus();
      loadMessages();
      setTimeout(() => feedback.textContent = '', 5000);
    }
  } catch (err) {
    feedback.textContent = 'Hiba a küldéskor.';
    feedback.classList.add('error');
    console.error(err);
  }
});

// Valós idejű frissítés Supabase v2 szerint
const channel = supabase
  .channel('guestbook_updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, payload => {
    console.log('Új üzenet érkezett:', payload);
    loadMessages();
  })
  .subscribe();

// Oldal betöltésekor üzenetek betöltése
loadMessages();
