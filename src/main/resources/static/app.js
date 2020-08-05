let hostnamePort = `${location.hostname}:${location.port}`;
let audio;
let currentlyPlaying = false;
let currentIndex = 0;
let queue = [];

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
            mainSongListComp.play(queue[currentIndex + 1]);
        },
        prev() {
            if (audio.currentTime < 3) {
                mainSongListComp.play(queue[currentIndex - 1]);
            } else {
                audio.currentTime = 0;
            }
        }
    }
})

let mainSongList = Vue.extend({
    template:
    `<div class="tab-container">
        <div class="list-container">
            <div class="list-section">
            <i class="material-icons-outlined play-pause" style="visibility: hidden;">play_arrow</i>
            <div class="artist-title-album section">
                <p class="list-title">Title</p>
                <p class="list-artist">Artist</p>
                <p class="list-album">Album</p>
                <p class="list-duration">Duration</p>
            </div>
            </div>
            <li v-for="item in songs" v-bind:song="item" v-on:mouseover="hover($event)" v-on:mouseleave="leave($event)" v-on:dblclick="play(item, false, true)" v-on:click="play(item, true, true)" :skey="item.id" :key="item.id" class="results-link">
                <i class="material-icons-outlined play-pause" style="opacity: 0;">play_arrow</i>
                <div class="artist-title-album">
                    <p class="list-title">{{ item.title }}</p>
                    <p class="list-artist"><span>{{item.artist}}</span></p>
                    <p class="list-album"><span>{{item.album}}</span></p>
                    <p class="list-duration"><span>{{item.dur}}</span></p>
                </div>
            </li>
        </div>
    </div>`,
    methods: {
        play(song, isTouch, newQueue) {
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
            mediaControls.playPauseIcon = 'pause'
            titleArtist.title = song.title;
            titleArtist.artist = song.artist;
            mobileNp.title = song.title;
            mobileNp.artist = song.artist;
            let imgURL = `http://${hostnamePort}/img/${song.artist}${song.album}.jpg`;
            fetch(imgURL).then(response => {
                if (response.ok) {
                    updateImg.updateBg(imgURL)
                } else {
                    updateImg.updateBg();
                }
            });
            currentIndex = queue.indexOf(song);
            this.updateActive();
            audio.play().then(() => {
                if (newQueue) {
                    queue = [];
                    mainSongListComp.songs.forEach(f => {
                        queue.push(f);
                    })
                    currentIndex = queue.indexOf(song);
                    this.updateActive();
                }
                updateMediaSession(song);
                audio.addEventListener('pause', pauseEvent);
                audio.addEventListener('play', playEvent);
                audio.addEventListener('ended', endedEvent)
                currentlyPlaying = true;
                audio.addEventListener('timeupdate', onceTimeUpdate);
                audio.addEventListener('timeupdate', timeUpdate);
            })
        },
        updateActive() {
            try {
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
            } catch(err){}
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

let onceTimeUpdate = () => {
    if (audio.duration != NaN) {
        songTime.duration = timeFormat(audio.duration);
        audio.removeEventListener('timeupdate', onceTimeUpdate);
    }
}

let timeUpdate = () => {
    document.querySelector('.fill').style.width = (audio.currentTime / audio.duration) * 100 + '%';
    songTime.current = timeFormat(audio.currentTime);
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

let allSongs = [];

fetch(`http://${hostnamePort}/api/getAllSongs`).then(resp => {
    resp.json().then(songs => {
        songs.forEach((f, i) => {
            if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                allSongs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, dur: f.duration});
            } else {
                allSongs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, dur: f.duration});
            }
            sortArray(allSongs, 'artist');
            setTimeout(() => {
                document.querySelector('.cover').style.opacity = 0;
                document.body.style.overflow = "auto";
                setTimeout(() => {
                    document.querySelector('.cover').style.display = 'none'
                }, 250)
            }, 350)
        })
        allSongs.forEach(f => {
            queue.push(f);
            mainSongListComp.songs.push(f);
        });

        mainSongListComp.$mount('.tab-container');
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
        songTime.current = timeFormat(pBar * audio.duration);
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

//song time

let timeFormat = s => {
    let min = Math.floor(s / 60);
    let sec = Math.floor(s - (min * 60));
    if (sec < 10){ 
        sec = `0${sec}`;
    }
    return `${min}:${sec}`;
}

let songTime = new Vue({
    el: '.song-timer',
    data() {
        return {
            current: '-:--',
            duration: '-:--'
        }
    }
})

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
        updateMode('light');
    } else {
        updateMode('dark');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        updateMode(e.matches ? 'dark' : 'light');
    })
} catch(err) {}

//sidebar

let currentActiveTab = 'allButton'

let mountedTab = null;

let sidebar = new Vue({
    el: '.temp-sidebar',
    template: 
    `<div class="sidebar-wrap">
        <div class="active-indicator" style="top: 85px"></div>
        <div v-for="item in sidebarItems" v-bind:sideitem="item" v-bind:id="item.id">
            <div v-on:load="active($event)" :style="active" v-on:click="click($event, item)" v-if="item.type == 'item'" class="side-item side-click">
                <i class="material-icons-outlined">{{ item.icon }}</i>
                <span>{{ item.label }}</span>
            </div>
            <div v-else-if="item.type == 'label'" class="side-label">{{item.label}}</div>
            <div v-else class="side-list-item side-click" v-on:click="click($event, listItem)" v-for="listItem in item.items" v-bind:listItems="listItem" v-bind:id="listItem.id">
                <div>{{listItem.label}}</div>
            </div>
        </div>
    </div>`,
    data() {
        return {
            sidebarItems: [
                {id: 'homeTab', type: 'item', label: 'Home', icon: 'home'},
                {id: 'settingsTab', type: 'item', label: 'Settings', icon: 'settings'},
                {id: 'addSongsTab', type: 'item', label: 'Add Songs', icon: 'add'},
                {id: 'libraryLabel', type: 'label', label: 'Library'},
                {id: 'likedTab', type: 'item', label: 'Liked Songs', icon: 'favorite_border'},
                {id: 'allTab', type: 'item', label: 'All Songs', icon: 'music_note'},
                {id: 'artistsTab', type: 'item', label: 'Artists', icon: 'person'},
                {id: 'albumsTab', type: 'item', label: 'Albums', icon: 'album'},
                {id: 'playlistLabel', type: 'label', label: 'Playlists'},
                {id: 'playlistsList', type: 'list', items: [{id: 'test', label: 'test label'}]}
            ]
        }
    },
    methods: {
        click(evt, item) {
            document.querySelectorAll('.side-click').forEach(f => {
                f.classList.remove('active');
            });
            evt.target.classList.add('active');
            let indicator = document.querySelector('.active-indicator');
            indicator.style.height = evt.target.getBoundingClientRect().height + 'px';
            indicator.style.top = evt.target.getBoundingClientRect().top + 'px';
            tabName.title = item.label;
            tabName.hideButtons();
            if (mountedTab != null) {
                mountedTab.$destroy;
                document.querySelector('.tab-container').innerHTML = '';
            }
            switch(item.id) {
                case "allTab":
                    mainSongListComp = new mainSongList({
                        data: {
                            songs: []
                        }
                    });
                    allSongs.forEach(f => {
                        mainSongListComp.songs.push(f);
                    });
                    mainSongListComp.$mount('.tab-container');
                    if (currentIndex) {
                        mainSongListComp.updateActive();
                    }
                    mountedTab = mainSongListComp;
                    break;
                case "homeTab":
                    let home = new homeTab;
                    home.$mount('.tab-container');
                    mountedTab = homeTab;
                    break;
                case "albumsTab":
                    album = new albumTab({
                        data() {
                            return {
                                albumList: []
                            }
                        }
                    });
                    let usedArtists = [];
                    fetch(`http://${hostnamePort}/api/getAllAlbums`).then(resp => {
                        resp.json().then(albums => {
                            sortArray(albums, "name");
                            albums.forEach((f, i) => {
                                album.albumList.push({id: i, name: f.name, artist: f.artist});
                            });
                        })
                    })
                    album.$mount('.tab-container');
                    mountedTab = albumTab;
                    break;
                default:
                    let missingTab = new noTab;
                    missingTab.$mount('.tab-container');
                    mountedTab = noTab;
            }
        },
        active(evt) {

        }
    }
});

let tabName = new Vue({
    el: '.top-title',
    data() {
        return {
            title: 'Home'
        }
    },
    methods: {
        async showButtons(showAlbumArt, album, artist) {
            document.querySelector('#tabBackButton').style.display = 'block';
            if (showAlbumArt) {
                let img =  `http://${hostnamePort}/img/${artist}${album}.jpg`;
                let finImg = `/assets/no_album.svg`;
                let getImg = fetch(img).then(resp => {
                    if (resp.ok) {
                        finImg = img;
                    }
                });
                await getImg;
                document.querySelector('.tab-album-art').style.backgroundImage = `url('${finImg}')`;
                document.querySelector('.tab-album-art').style.display = 'block';
            }
        },
        hideButtons() {
            document.querySelector('#tabBackButton').style.display = 'none';
            document.querySelector('.tab-album-art').style.display = 'none';
        }
    }
})

//missing tab
let noTab = Vue.extend({
    template: 
    `<div class="tab-container">
        <div class="no-tab">
            <i class="material-icons-outlined missing-icon">block</i>
            <div>
                <h1>Tab missing</h1>
                <p>The handler for this tab seems to be missing.</p>
            </div>
        </div>
    </div>`
});

//home tab
let homeTab = Vue.extend({
    template: 
    `<div class="tab-container">
        <div class="home">
            <i class="material-icons-outlined missing-icon">home</i>
            <div>
                <h1>We're busy building your home tab!</h1>
                <p>Check back later, you'll see this tab change over time!</p>
            </div>
        </div>
    </div>`
});

let home = new homeTab

//home.$mount('.tab-container');

//albums tab

Vue.component('album-items', {
    props: ['album'],
    template:
    `<div class="album-item" v-on:click="getAlbum(album.name, album.artist)">
        <img loading="lazy" class="album-item-art" @load="load" v-bind:src="bg"/>
        <div class="album-info">
            <p class="album-name">{{album.name}}</p>
            <p class="album-artist">{{album.artist}}</p>
        </div>
    </div>`,
    asyncComputed: {
        bg: async function() {
            let img =  `http://${hostnamePort}/img/${this.album.artist}${this.album.name}.jpg`;
            let finImg = `/assets/no_album.svg`;
            let getImg = fetch(img).then(resp => {
                if (resp.ok) {
                    finImg = img;
                }
            });
            await getImg;
            return finImg;
        }
    },
    methods: {
        load() {
            this.$el.children[0].style.opacity = 1;
        },
        getAlbum(album, artist) {
            fetch(`http://${hostnamePort}/api/getAlbum?album=${encodeURIComponent(album)}`).then(resp => {
                resp.json().then(songs => {
                    mountedTab.$destroy;
                    document.querySelector('.tab-container').innerHTML = '';
                    mainSongListComp = new mainSongList({
                        data: {
                            songs: []
                        }
                    });
                    songs.forEach((f, i) => {
                        if (f.title == null || f.artist == null || f.album == null || f.title == "" || f.artist == "" || f.album == "") {
                            mainSongListComp.songs.push({id: f.id, title: f.fileName, artist: "Unknown Artist", album: "Unknown Album", fileName: f.fileName, dur: f.duration});
                        } else {
                            mainSongListComp.songs.push({id: f.id, title: f.title, artist: f.artist, album: f.album, fileName: f.fileName, dur: f.duration});
                        }
                        sortArray(mainSongListComp.songs, 'title');
                        setTimeout(() => {
                            document.querySelector('.cover').style.opacity = 0;
                            document.body.style.overflow = "auto";
                            setTimeout(() => {
                                document.querySelector('.cover').style.display = 'none'
                            }, 250)
                        }, 350)
                    });
                    tabName.showButtons(true, album, artist);
                    tabName.title = album;
                    mainSongListComp.$mount('.tab-container');
                    if (currentIndex) {
                        mainSongListComp.updateActive();
                    }
                    mountedTab = mainSongListComp;
                })
            })
        }
    }
})

let albumTab = Vue.extend({
    template: 
    `<div class="tab-container">
        <div class="album-tab">
            <album-items v-for="item in albumList" v-bind:album="item" v-bind:id="item.id"></album-items>
        </div>
    </div>`
})

let mobileNp = new Vue({
    el: '.np-mobile-container',
    methods: {
        expand() {
            document.body.style.overflow = 'hidden';
            document.querySelector('.np-top').classList.add('expand');
            document.querySelector('.np-container').style.opacity = 1;
            document.querySelector('.np-container').style.display = 'flex'
            this.$el.style.display = 'none';
            document.querySelector('.np-mobile-container').style.opacity = 0;
        },
        playPause() {
            
        }
    },
    data() {
        return {
            title: 'No song playing',
            artist: ''
        }
    }
});

let mobileNpExpand = new Vue({
    el: '.mobile-top-btns',
    methods: {
        hide() {
            document.body.style.overflow = 'auto';
            document.querySelector('.np-top').classList.remove('expand');
            document.querySelector('.np-container').style.opacity = 0;
            setTimeout(() => {
                document.querySelector('.np-container').style.display = 'none';
                document.querySelector('.np-mobile-container').style.display = 'flex';
                setTimeout(() => {
                    document.querySelector('.np-mobile-container').style.opacity = 1;
                }, 20)
            }, 500)
        }
    }
})