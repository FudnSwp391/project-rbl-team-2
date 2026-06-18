const fs = require('fs');

fetch('https://api.elevenlabs.io/v1/text-to-speech/d5HVupAWCwe4e6GvMCAL/stream', {
  method: 'POST',
  headers: {
    'xi-api-key': '5c2aad7e176a1d859351118d277470fa6daa5c14dd82105803bc4646ee26438f',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "Hello",
    model_id: "eleven_multilingual_v2"
  })
})
.then(res => res.text().then(text => console.log('STATUS:', res.status, 'BODY:', text)))
.catch(err => console.error(err));
