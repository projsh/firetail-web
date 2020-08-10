package xyz.projsh.firetailweb.api;

import com.mongodb.client.FindIterable;
import static com.mongodb.client.model.Filters.eq;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.projsh.firetailweb.Database;
import xyz.projsh.firetailweb.FiretailWeb;

@RestController
@RequestMapping("/api")
public class Api {
    
    @GetMapping("/songs")
    public Set<GetSong> getAllSongs() {
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        for (Document song : songs) {
            files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
        }
        return files;
    }
    
    @GetMapping("/albums")
    public Set<AllAlbums> getAllAlbums() {
        FindIterable<Document> songs = Database.songs.find();
        Set<AllAlbums> albums = new HashSet<>();
        Map<String, Boolean> foundAlbum = new HashMap<String, Boolean>();
        for (Document song : songs) {
            try {
                if (!foundAlbum.get(song.getString("album"))) {
                    if (!song.getString("album").equals(null)) {
                        albums.add(new AllAlbums(song.getString("album"), song.getString("artist")));
                        foundAlbum.put(song.getString("album"), true);
                    }
                }
            } catch(NullPointerException err) {
                try {
                    if (!song.getString("album").equals(null)) {
                        albums.add(new AllAlbums(song.getString("album"), song.getString("artist")));
                        foundAlbum.put(song.getString("album"), true);
                    }
                } catch(NullPointerException err1) {};
            }
        }
        return albums;
    }
    
    @GetMapping("/albums/get")
    public Set<GetSong> getAlbum(@RequestParam String album) {
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        for (Document song : songs) {
            try {
                if (!song.getString("album").equals(null) && song.getString("album").equals(album)) {
                    System.out.println(song.getString("album"));
                    files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
                }
            } catch(NullPointerException err) {
                //System.out.println(err.getMessage());
            }
        }
        return files;
    }
    
    @GetMapping("/artists")
    public Set<AllArtists> getAllArtists() {
        FindIterable<Document> songs = Database.songs.find();
        Set<AllArtists> artists = new HashSet<>();
        Map<String, Boolean> foundAlbum = new HashMap<String, Boolean>();
        for (Document song : songs) {
            try {
                if (!foundAlbum.get(song.getString("artist"))) {
                    if (!song.getString("artist").equals(null)) {
                        artists.add(new AllArtists(song.getString("artist")));
                        foundAlbum.put(song.getString("album"), true);
                    }
                }
            } catch(NullPointerException err) {
                try {
                    if (!song.getString("artist").equals(null)) {
                        artists.add(new AllArtists(song.getString("artist")));
                        foundAlbum.put(song.getString("artist"), true);
                    }
                } catch(NullPointerException err1) {};
            }
        }
        return artists;
    }
    
    @GetMapping("/artists/get")
    public Set<GetSong> getArtist(@RequestParam String artist) {
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        for (Document song : songs) {
            try {
                if (!song.getString("artist").equals(null) && song.getString("artist").equals(artist)) {
                    System.out.println(song.getString("artist"));
                    files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
                }
            } catch(NullPointerException err) {
                //System.out.println(err.getMessage());
            }
        }
        return files;
    }
    
    @GetMapping("/restart")
    public void restart() {
        Thread restartThread = new Thread(() -> {
            try {
                Thread.sleep(1000);
                FiretailWeb.restart();
                
            } catch (InterruptedException err) {
            
            }
        });
        restartThread.setDaemon(false);
        restartThread.start();
    }
    
    @PostMapping("/playlists/create")
    public Set<Playlist> createPlaylist(@RequestBody UpdatePlaylist playlist) {
        System.out.println(playlist.getName());
        Document playlistDoc = new Document("name", playlist.getName())
                .append("desc", playlist.getDesc())
                .append("imgData", playlist.getImgData())
                .append("songs", playlist.getSongs());
        Database.playlists.insertOne(playlistDoc);
        return getAllPlaylists();
    }
    
    @GetMapping("/playlists")
    public Set<Playlist> getAllPlaylists() {
        FindIterable<Document> playlists = Database.playlists.find();
        Set<Playlist> plist = new HashSet<>();
        for (Document pl : playlists) {
            plist.add(new Playlist(pl.getString("name"), pl.getString("desc"), pl.getString("imgData"), pl.getList("songs", String.class), pl.get("_id").toString()));
        }
        return plist;
    }
    
    @GetMapping("/playlists/names")
    public List<PlaylistNames> getPlaylistNames() {
        FindIterable<Document> playlists = Database.playlists.find();
        List<PlaylistNames> pListNames = new ArrayList<>();
        for (Document pl : playlists) {
            pListNames.add(new PlaylistNames(pl.getString("name"), pl.get("_id").toString()));
        }
        return pListNames;
    }
    
    @PostMapping("/playlists/update")
    public Set<Playlist> updatePlaylist(@RequestBody UpdatePlaylist playlist) {
        Database.playlists.updateOne(eq("_id", new ObjectId(playlist.getId())), new Document("$set", new Document("name", playlist.getName())
            .append("desc", playlist.getDesc())
            .append("imgData", playlist.getImgData())
            .append("songs", playlist.getSongs())));
        return getAllPlaylists();
    }
    
    @GetMapping("/playlists/get")
    public Playlist getPlaylist(@RequestParam String id) {
        Document pl = Database.playlists.find(eq("_id", new ObjectId(id))).first();
        return new Playlist(pl.getString("name"), pl.getString("desc"), pl.getString("imgData"), pl.getList("songs", String.class), pl.get("_id").toString());
    }
    
    @GetMapping("/playlists/delete")
    public Set<Playlist> deletePlaylist(@RequestParam String id) {
        Document pl = Database.playlists.find(eq("_id", new ObjectId(id))).first();
        Database.playlists.deleteOne(pl);
        return getAllPlaylists();
    }
    
}