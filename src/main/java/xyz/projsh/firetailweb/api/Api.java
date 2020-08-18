package xyz.projsh.firetailweb.api;

import com.mongodb.client.FindIterable;
import static com.mongodb.client.model.Filters.eq;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import xyz.projsh.firetailweb.Database;
import xyz.projsh.firetailweb.FiretailWeb;

/*
    This is the API class. It handles the server's web API.
    Everything here is mapped to /api

    All the other classes in this package are used as objects for sending and receiving data.
*/
@RestController
@RequestMapping("/api")
public class Api {
    
    /*
        Mapped to /api/songs.
        This returns every document in the songs collection in the database as an array.
        Every array element contains a GetSong object, which contains the following: title, artist, album, file name, document ID and song duration.
        This is called everytime the web app is launched.
    */
    @GetMapping("/songs")
    public Set<GetSong> getAllSongs() {
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        for (Document song : songs) {
            files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
        }
        return files;
    }
    
    /*
        Mapped to /api/songs/search
        This requires a query parameter, which is the search query.
        Returns an array of each song that matches (title, artist, album, fileName) the query
    */
    @GetMapping("/songs/search")
    public Set<GetSong> searchSongs(@RequestParam String query) {
        query = URLDecoder.decode(query, StandardCharsets.UTF_8);
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        query = query.toLowerCase();
        for (Document song : songs) {
            try {
                 if (song.getString("title").toLowerCase().contains(query) || song.getString("artist").toLowerCase().contains(query) || song.getString("album").toLowerCase().contains(query) || song.getString("fileName").toLowerCase().contains(query)) {
                     files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
                 }
            } catch(NullPointerException err) {}
        }
        return files;
    }
    
    /*
        Mapped to /songs/add
        This handles a POST request, so it requires a body.
        The body is a byte array of the uploaded file's data.
        The POST request requires a Filename header, which is the file's original filename.
        This will check the file for the correct format, then writes it to disk.
        Returns a byte array.
    */
    @PostMapping("/songs/add")
    public byte[] addSong(@RequestBody byte[] song, @RequestHeader("Filename") String filename) {
        filename = URLDecoder.decode(filename, StandardCharsets.UTF_8);
        int lastIndexOf = filename.lastIndexOf(".");
        String ext = filename.substring(lastIndexOf);
        System.out.println(ext);
        if (ext.equals(".mp3") || ext.equals(".m4a")) {
            try {
                FileOutputStream stream = new FileOutputStream(new File(String.format("%s/.firetail-web/songs/%s", System.getProperty("user.home"), filename)));
                stream.write(song);
                stream.close();
                Database.addSong(new File(String.format("%s/.firetail-web/songs/%s", System.getProperty("user.home"), filename)));
            } catch (IOException ex) {
                Logger.getLogger(Api.class.getName()).log(Level.SEVERE, null, ex);
            }
        } else {
            return new byte[] {};
        }
        return song;
    }
    
    /*
        Mapped to /songs/delete
        This handles a POST request, so it requires a body.
        The body is a string array which contains all the song IDs that
        need to be removed.
        This will search the database for the document matching the song ID and
        then removes it.
        Returns all songs in the database.
    */
    @PostMapping("/songs/delete")
    public Set<GetSong> deleteSong(@RequestBody String[] ids) {
        for (String id : ids) {
            Document song = Database.songs.find(eq("_id", new ObjectId(id))).first();
            Database.songs.deleteOne(song);
        }
        return getAllSongs();
    }
    
    /*
        Mapped to /api/albums.
        This searches for every document in the songs collection for albums.
        If a new album is found, it will be added to the foundAlbum map so no duplicates are sent.
        Once all the albums are found, it will return an array with the AllAlbums object, which contains the following: album and artist.
        This is called when the albums tab on the web app is clicked.
    */
    @GetMapping("/albums")
    public Set<AllAlbums> getAllAlbums() {
        FindIterable<Document> songs = Database.songs.find();
        Set<AllAlbums> albums = new HashSet<>();
        Map<String, Boolean> foundAlbum = new HashMap<>();
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
    
    /*
        Mapped to /api/albums/get
        This requires an album parameter, which is the album's ID.
        Will return every song in the requested album as an array.
    */
    @GetMapping("/albums/get")
    public Set<GetSong> getAlbum(@RequestParam String album) {
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        for (Document song : songs) {
            try {
                if (song.getString("album").equals(album)) {
                    System.out.println(song.getString("album"));
                    files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
                }
            } catch(NullPointerException err) {}
        }
        return files;
    }
    
    /*
        Mapped to /api/artists.
        This searches for every document in the songs collection for artists.
        If a new artist is found, it will be added to the foundArtist map so no duplicates are sent.
        Once all the artists are found, it will return an array with the AllArtists object, which only contains the artist.
        This is called when the artists tab on the web app is clicked.
    */
    @GetMapping("/artists")
    public Set<AllArtists> getAllArtists() {
        FindIterable<Document> songs = Database.songs.find();
        Set<AllArtists> artists = new HashSet<>();
        Map<String, Boolean> foundArtist = new HashMap<>();
        for (Document song : songs) {
            try {
                if (!foundArtist.get(song.getString("artist"))) {
                    if (!song.getString("artist").equals(null)) {
                        artists.add(new AllArtists(song.getString("artist")));
                        foundArtist.put(song.getString("artist"), true);
                    }
                }
            } catch(NullPointerException err) {
                try {
                    if (!song.getString("artist").equals(null)) {
                        artists.add(new AllArtists(song.getString("artist")));
                        foundArtist.put(song.getString("artist"), true);
                    }
                } catch(NullPointerException err1) {};
            }
        }
        return artists;
    }
    
    /*
        Mapped to /api/artists/get
        This requires an artist parameter, which is the artist's ID.
        Will return every song in the requested artist as an array.
    */
    @GetMapping("/artists/get")
    public Set<GetSong> getArtist(@RequestParam String artist) {
        FindIterable<Document> songs = Database.songs.find();
        Set<GetSong> files = new HashSet<>();
        for (Document song : songs) {
            try {
                if (song.getString("artist").equals(artist)) {
                    System.out.println(song.getString("artist"));
                    files.add(new GetSong(song.getString("title"), song.getString("artist"),song.getString("album"), song.getString("fileName"), song.get("_id").toString(), song.getString("duration")));
                }
            } catch(NullPointerException err) {}
        }
        return files;
    }
    
    /*
        Mapped to /api/restart
        Restarts the server by calling restart in the FiretailWeb class.
    */
    @GetMapping("/restart")
    public void restart() {
        Thread restartThread = new Thread(() -> {
            try {
                Thread.sleep(1000);
                FiretailWeb.restart();
                
            } catch (InterruptedException err) {}
        });
        restartThread.setDaemon(false);
        restartThread.start();
    }
    
    /*
        Mapped to /api/playlists
        Returns an array of every document in the playlists collection.
        Each element in the array contains a Playlist object, which contains the
        playlist name, description, image data, song ID array and the playlist ID.
    */
    @GetMapping("/playlists")
    public Set<Playlist> getAllPlaylists() {
        FindIterable<Document> playlists = Database.playlists.find();
        Set<Playlist> plist = new HashSet<>();
        for (Document pl : playlists) {
            plist.add(new Playlist(pl.getString("name"), pl.getString("desc"), pl.getString("imgData"), pl.getList("songs", String.class), pl.get("_id").toString()));
        }
        return plist;
    }
    
    /*
        Mapped to /api/playlists/create
        This handles a POST request, so it requires a body.
        The body is of type UpdatePlaylist and contains the required
        data to create a new playlist.
        This will create a new BSON document then inserts the document
        into the playlist collection in the database.
        It will then return the same function that /api/playlists uses.
    */
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
    
    /*
        Mapped to /api/playlists/names
        This is very similar to the /api/playlists mapping,
        but only returns an array of playlist names and IDs. This is used
        primarily for displaying available playlists in the web app.
    */
    @GetMapping("/playlists/names")
    public List<PlaylistNames> getPlaylistNames() {
        FindIterable<Document> playlists = Database.playlists.find();
        List<PlaylistNames> pListNames = new ArrayList<>();
        for (Document pl : playlists) {
            pListNames.add(new PlaylistNames(pl.getString("name"), pl.get("_id").toString()));
        }
        return pListNames;
    }
    
    /*
        Mapped to /api/playlists/update
        This handles a POST request, so it requires a body.
        The body contains the newly updated playlist data.
        This will search for the playlist with the matching ID, then
        updates it by creating a new BSON documents and replaces the existing
        document with the updated one.
        It will then return the same function that /api/playlists uses.
    */
    @PostMapping("/playlists/update")
    public Set<Playlist> updatePlaylist(@RequestBody UpdatePlaylist playlist) {
        Database.playlists.updateOne(eq("_id", new ObjectId(playlist.getId())), new Document("$set", new Document("name", playlist.getName())
            .append("desc", playlist.getDesc())
            .append("imgData", playlist.getImgData())
            .append("songs", playlist.getSongs())));
        return getAllPlaylists();
    }
    
    /*
        Mapped to /api/playlists/get
        This requires an ID parameter, which is the playlist's ID.
        This searches the playlists collection in the database for a matching ID,
        then returns the playlist's data such as the name, description, image data, songs array and ID.
    */
    @GetMapping("/playlists/get")
    public Playlist getPlaylist(@RequestParam String id) {
        Document pl = Database.playlists.find(eq("_id", new ObjectId(id))).first();
        return new Playlist(pl.getString("name"), pl.getString("desc"), pl.getString("imgData"), pl.getList("songs", String.class), pl.get("_id").toString());
    }
    
    /*
        Mapped to /api/playlists/delete
        This requires an ID parameter, which is the playlist's ID.
        This searches the playlists collection in the database for a matching ID,
        then deletes the document matching the ID.
        It will then return the same function that /api/playlists uses.
    */
    @GetMapping("/playlists/delete")
    public Set<Playlist> deletePlaylist(@RequestParam String id) {
        Document pl = Database.playlists.find(eq("_id", new ObjectId(id))).first();
        Database.playlists.deleteOne(pl);
        return getAllPlaylists();
    }
    
    /*
        Mapped to /about
        Simply returns information about the server, including the OS name,
        OS version, Java version and the logged in username.
        Used in the settings server information area.
        If the OS string matches "Mac OS X", it is changed to "macOS".
    */
    @GetMapping("/about")
    public String about() {
        String os = System.getProperty("os.name");
        String osVer = System.getProperty("os.version");
        String javaVer = System.getProperty("java.version");
        String username = System.getProperty("user.name");
        if (os.equals("Mac OS X")) {
            os = "macOS";
        }
        return String.format("Operating System: %s<br>Version: %s<br>Java SE Version: %s<br>Server Username: %s", os, osVer, javaVer, username);
    }
    
}