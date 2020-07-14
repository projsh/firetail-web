let playButton = document.querySelector("#playAudio");
let audio;

let hostnamePort = `${location.hostname}:${location.port}`;

let supportsPassive = false;
try {
    let opts = Object.defineProperty({}, 'passive', {
        get: () => {
            supportsPassive = true;
        }
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
} catch (e) {}

let songInput = document.querySelector('#songInput');

let simpleSort = (array) => {
    function compare(a, b) {
        if (a.toLowerCase() < b.toLowerCase()) return -1;
        if (a.toLowerCase() > b.toLowerCase()) return 1;
    }
    return array.sort(compare);
}

fetch(`http://${hostnamePort}/api/getfiles`).then(resp => {
    resp.json().then(js => {
        songInput.innerHTML = "";
        songs = simpleSort(js);
        songs.forEach(f => {
            songInput.innerHTML += `<option>${f}</option>`;
        })
    })
})

let songURL;

let playAudio = song => {
    if (audio != undefined) {
        audio.removeEventListener('timeupdate', timeUpdate);
        audio.src = song;
        audio.play();
        audio.addEventListener('timeupdate', timeUpdate);
        return;
    }
    audio = new Audio(song);
    audio.play();
    audio.addEventListener('timeupdate', timeUpdate);
}

let timeFormat = s => {
    let min = Math.floor(s / 60);
    let sec = Math.floor(s - (min * 60));
    if (sec < 10){ 
        sec = `0${sec}`;
    }
    return `${min}:${sec}`;
}

playButton.addEventListener("click", () => {
    let sbFix = songInput.selectedOptions[0].textContent.replace(/[\[]/g, "%5B").replace(/[\]]/g, "%5D").replace(/[\(]/g, "%28").replace(/[\)]/g, "%29");
    let song = `http://${hostnamePort}/audio/${sbFix}`;
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        playAudio(song);
    } else {
        fetch(`http://${hostnamePort}/api/getFile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: songInput.selectedOptions[0].textContent
        }).then(resp => {
            if (resp.ok) {
                if (songURL) {
                    window.URL.revokeObjectURL(songURL);
                }
                resp.arrayBuffer().then(buffer => {
                    let blob = new Blob([buffer], {type: 'audio/mp3'});
                    songURL = window.URL.createObjectURL(blob);
                    playAudio(songURL);
                })
            } else {
                alert('could not play song! does it even exist??');
            }
        })
    }
});

let seekBar = document.querySelector('#seek');

let timeUpdate = () => {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
    document.querySelector('#duration').textContent = `${timeFormat(audio.currentTime)} / ${timeFormat(audio.duration)}`;
}

seekBar.addEventListener('change', evt => {
    audio.currentTime = (evt.target.value / 100) * audio.duration;
    audio.addEventListener('timeupdate', timeUpdate);
})

seekBar.addEventListener('input', evt => {
    document.querySelector('#duration').textContent = `${timeFormat((evt.target.value / 100) * audio.duration)} / ${timeFormat(audio.duration)}`;
})

seekBar.addEventListener('mousedown', () => {
    audio.removeEventListener('timeupdate', timeUpdate);
});

seekBar.addEventListener('mouseup', () => {
    audio.addEventListener('timeupdate', timeUpdate);
});

seekBar.addEventListener('touchstart', () => {
    audio.removeEventListener('timeupdate', timeUpdate);
}, supportsPassive ? { passive: true } : false);

let isPaused = false;
let pausePlay = document.querySelector('#pausePlay');
pausePlay.addEventListener('click', () => {
    if (isPaused) {
        audio.play();
        pausePlay.textContent = "Pause"
        isPaused = false;
    } else {
        audio.pause();
        pausePlay.textContent = "Play"
        isPaused = true;
    }
})