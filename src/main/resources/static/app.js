let hostnamePort = `${location.hostname}:${location.port}`;
let audio;
let currentlyPlaying = false;
let currentIndex = 0;

let titleArtist = new Vue({
    el: '.np-ctrl.metadata',
    data() {
        return {
            title: 'No song playing',
            artist: ''
        }
    }
});

let touch = false;
window.addEventListener('pointerover', evt => {
    if (evt.pointerType == 'touch') {
        touch = true;
        document.querySelector('.handle').classList.add('handle-hover')
    } else {
        touch = false;
        document.querySelector('.handle').classList.remove('handle-hover')
    }
});

let mediaControls = new Vue({
    el: '.media-controls',
    data() {
        return {
            playPauseIcon: 'play_arrow'
        }
    },
    methods: {
        playPause() {
            if (audio) {
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
            }
        },
        skip() {
            mainSongListComp.play(mainSongListComp.songs[currentIndex + 1]);
        },
        prev() {
            if (audio.currentTime < 3) {
                mainSongListComp.play(mainSongListComp.songs[currentIndex - 1]);
            } else {
                audio.currentTime = 0;
            }
        }
    }
})

let mainSongList = Vue.extend({
    template:
    `<div class="list-container">
        <div class="list-section">
        <i class="material-icons-outlined play-pause" style="visibility: hidden;">play_arrow</i>
        <div class="artist-title-album section">
            <p class="list-title">Title</p>
            <p class="list-artist">Artist</p>
            <p class="list-album">Album</p>
            <p class="list-duration">Duration</p>
        </div>
        </div>
        <li v-for="item in songs" v-bind:song="item" v-on:mouseover="hover($event)" v-on:mouseleave="leave($event)" v-on:dblclick="play(item)" v-on:click="play(item, true)" :skey="item.id" :key="item.id" class="results-link">
            <i class="material-icons-outlined play-pause" style="opacity: 0;">play_arrow</i>
            <div class="artist-title-album">
                <p class="list-title">{{ item.title }}</p>
                <p class="list-artist"><span>{{item.artist}}</span></p>
                <p class="list-album"><span>{{item.album}}</span></p>
                <p class="list-duration"><span>{{item.dur}}</span></p>
            </div>
        </li>
    </div>`,
    methods: {
        play(song, isTouch) {
            if (isTouch) {
                if (!touch) return;
            }
            if (!audio) {
                audio = new Audio();
            }
            audio.removeEventListener('timeupdate', timeUpdate);
            audio.removeEventListener('pause', pauseEvent);
            audio.removeEventListener('play', playEvent);
            audio.removeEventListener('ended', endedEvent);
            audio.src = `http://${hostnamePort}/audio/${song.fileName}`;
            document.querySelector('.fill').style.width = '0%';
            //audio.load();
            currentIndex = mainSongListComp.songs.indexOf(song);
            this.updateActive();
            mediaControls.playPauseIcon = 'pause'
            titleArtist.title = song.title;
            titleArtist.artist = song.artist;
            let imgURL = `http://${hostnamePort}/img/${song.artist}${song.album}.jpg`;
            fetch(imgURL).then(response => {
                if (response.ok) {
                    updateImg.updateBg(imgURL)
                } else {
                    updateImg.updateBg();
                }
            })
            audio.play().then(() => {
                updateMediaSession(song);
                audio.addEventListener('pause', pauseEvent);
                audio.addEventListener('play', playEvent);
                audio.addEventListener('ended', endedEvent)
                currentlyPlaying = true;
                audio.addEventListener('timeupdate', timeUpdate);
            })
        },
        updateActive() {
            let all = document.querySelectorAll('.results-link');
            all.forEach(f => {
                f.classList.remove('active');
                f.children[0].textContent = 'play_arrow';
                f.children[0].style.opacity = 0;
            });
            let icon = all[currentIndex].children[0]
            all[currentIndex].classList.add('active');
            icon.textContent = 'volume_up';
            icon.style.opacity = 1;
        },
        hover(evt) {
            if (evt.target.children[0]) {
                let icon = evt.target.children[0];
                icon.style.opacity = 1;
            }
        },
        leave(evt) {
            let icon = evt.target.children[0];
            if (icon.textContent != 'volume_up') {
                icon.style.opacity = 0;
            }
        }
    }
});

let pauseEvent = () => {
    mediaControls.playPauseIcon = 'play_arrow';
}

let playEvent = () => {
    mediaControls.playPauseIcon = 'pause';
}

let endedEvent = () => {
    mediaControls.skip();
    console.log('end')
}

let updateMediaSession = (song) => {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: song.artist,
            album: song.album,
            artwork: [{src: `http://${hostnamePort}/img/${song.artist}${song.album}.jpg`, sizes: '512x512', type: 'image/jpeg'}]
        })
        if ('setPositionState' in navigator.mediaSession) {
            navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: audio.playbackRate,
                position: audio.currentTime
            });
        }
    }

}

if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('previoustrack', mediaControls.prev);
    navigator.mediaSession.setActionHandler('nexttrack', mediaControls.skip);
}

let timeUpdate = () => {
    document.querySelector('.fill').style.width = (audio.currentTime / audio.duration) * 100 + '%';
}

let sortArray = (array, sortBy) => {
    function compare(a, b) {
        if (a[sortBy].toLowerCase() < b[sortBy].toLowerCase()) return -1;
        if (a[sortBy].toLowerCase() > b[sortBy].toLowerCase()) return 1;
    }
    return array.sort(compare);
}

let mainSongListComp = new mainSongList({
    data: {
        songs: []
    }
});

mainSongListComp.$mount('#mount-point');

fetch(`http://${hostnamePort}/api/getAllSongs`).then(resp => {
    resp.json().then(songs => {
        songs.forEach((f, i) => {
            if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, dur: f.duration});
            } else {
                mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, dur: f.duration});
            }
            sortArray(mainSongListComp.songs, 'artist')
        })
    })
});

Vue.component('seek-bar', {
    template:
    `<div id="seekWrapper" v-on:mousedown="down" v-on:touchstart="down" v-on:mouseover="hover" v-on:mouseleave="leave" class="np-ctrl seek">
        <div class="seek-bar">
            <div class="fill"></div>
            <div class="handle"></div>
        </div>
    </div>`,
    methods: {
        down(e) {
            mousetouchdown(e);
        },
        hover() {
            document.querySelector('.handle').classList.add('handle-hover');
        },
        leave() {
            if (seekMouseDown) return;
            if (touch) return;
            document.querySelector('.handle').classList.remove('handle-hover')
        }
    }
});

new Vue({
    el: '.seek-container'
})

let seekBar;
let seekBarWrapper;
let seekFillBar;
setTimeout(() => {
    seekBar = document.querySelector('.seek-bar');
    seekBarWrapper = document.querySelector('#seekWrapper');
    seekFillBar = document.querySelector('.fill');
}, 50)
let seekMouseDown = false;

let clamp = (min, val, max) => {
    return Math.min(Math.max(min, val), max);
}

let getP = (e, el) => {
    pBar = (e.clientX - el.getBoundingClientRect().x) / el.clientWidth;
    pBar = clamp(0, pBar, 1);
    return pBar;
}

let mousetouchdown = e => {
    if (currentlyPlaying) {
        if (e.touches) {
            e = e.touches[0]
        }
        seekMouseDown = true;
        pBar = getP(e, seekBar);
        seekFillBar.style.width = pBar * 100 + '%';
        audio.removeEventListener('timeupdate', timeUpdate);
        document.querySelector('.handle').classList.add('handle-hover')
    }
}

let mousetouchmove = e => {
    if (!seekMouseDown) return;
    if (currentlyPlaying && seekMouseDown) {
        seekFillBar.style.transition = 'none';
        if (e.touches) {
            e = e.touches[0]
        }
        pBar = getP(e, seekBar);
        seekFillBar.style.width = pBar * 100 + '%';
        minutes = Math.floor((pBar * audio.duration) / 60);
        seconds = Math.floor((pBar * audio.duration) / 1);
        while (seconds >= 60) {
            seconds = seconds - 60;
        }
        if (seconds > -1 && seconds < 10) {
            seconds = ('0' + seconds).slice(-2);
        }
        //document.querySelector('#songDurationTime').innerHTML = `${minutes}:${seconds}`
    }
}

let mousetouchup = e => {
    seekFillBar.style.removeProperty('transition');
    if (!seekMouseDown) return;
    if (currentlyPlaying) {
        if (e.changedTouches) {
            e = e.changedTouches[0]
        }
        seekMouseDown = false;
        pBar = getP(e, seekBar);
        seekFillBar.style.width = pBar * 100 + '%';
        audio.currentTime = pBar * audio.duration;
        audio.addEventListener('timeupdate', timeUpdate);
        if (touch) return;
        document.querySelector('.handle').classList.remove('handle-hover')
    }
}


window.addEventListener('mousemove', e => {
    mousetouchmove(e)
});

window.addEventListener('touchmove', e => {
    mousetouchmove(e)
});

window.addEventListener('mouseup', e => {
    mousetouchup(e);
});

window.addEventListener('touchend', e => {
    mousetouchup(e);
});

let updateImg = new Vue({
    el: '.np-img',
    data() {
        return {
            bg: '/assets/no_image.svg'
        }
    },
    methods: {
        updateBg(url) {
            if (url) {
                this.bg = `background-image: url('${url}')`;
            } else {
                this.bg = `background-image: url('/assets/no_image.svg')`
            }
        }
    }
});

let updateMode = scheme => {
    let thing = document.querySelector('html').classList;
    if (scheme == 'dark') {
        thing.remove('light')
        thing.add('dark');
    } else {
        thing.remove('dark');
        thing.add('light');
    }
}

try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        updateMode('dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        updateMode('dark');
    } else {
        updateMode('dark');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        updateMode(e.matches ? 'dark' : 'light');
    })
} catch(err) {}

//sidebar

let currentActiveTab = 'allButton'

let sidebar = new Vue({
    el: '.temp-sidebar',
    template: 
    `<div class="sidebar-wrap">
        <div class="active-indicator" style="top: 85px"></div>
        <div v-for="item in sidebarItems" v-bind:sideitem="item" v-bind:id="item.id">
            <div v-on:load="active($event)" :style="active" v-on:click="click($event)" v-if="item.type == 'item'" class="side-item side-click">
                <i class="material-icons-outlined">{{ item.icon }}</i>
                <span>{{ item.label }}</span>
            </div>
            <div v-else-if="item.type == 'label'" class="side-label">{{item.label}}</div>
            <div v-else class="side-list-item side-click" v-on:click="click($event)" v-for="listItem in item.items" v-bind:listItems="listItem" v-bind:id="listItem.id">
                <div>{{listItem.label}}</div>
            </div>
        </div>
    </div>`,
    data() {
        return {
            sidebarItems: [
                {id: 'homeButton', type: 'item', label: 'Home', icon: 'home'},
                {id: 'settingsButton', type: 'item', label: 'Settings', icon: 'settings'},
                {id: 'libraryLabel', type: 'label', label: 'Library'},
                {id: 'likedButton', type: 'item', label: 'Liked Songs', icon: 'favorite_border'},
                {id: 'allButton', type: 'item', label: 'All Songs', icon: 'music_note'},
                {id: 'artistsButton', type: 'item', label: 'Artists', icon: 'person'},
                {id: 'albumsButton', type: 'item', label: 'Albums', icon: 'album'},
                {id: 'playlistLabel', type: 'label', label: 'Playlists'},
                {id: 'playlistsList', type: 'list', items: [{id: 'test', label: 'test label'}]}
            ]
        }
    },
    methods: {
        click(evt) {
            console.log(evt);
            console.log(evt.target.getBoundingClientRect());
            document.querySelectorAll('.side-click').forEach(f => {
                f.classList.remove('active');
            })
            evt.target.classList.add('active');
            let indicator = document.querySelector('.active-indicator');
            indicator.style.height = evt.target.getBoundingClientRect().height + 'px';
            indicator.style.top = evt.target.getBoundingClientRect().top + 'px';
        },
        active(evt) {

        }
    }
});