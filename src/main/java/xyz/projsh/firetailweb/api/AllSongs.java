package xyz.projsh.firetailweb.api;

public class AllSongs {
    
    private final String title;
    private final String artist;
    private final String album;
    private final String fileName;
    private final String id;
    private final String duration;
    
    public AllSongs(String title, String artist, String album, String fileName, String id, String duration) {
        this.title = title;
        this.artist = artist;
        this.album = album;
        this.fileName = fileName;
        this.id = id;
        this.duration = duration;
    }
    
    public String getTitle() {
        return title;
    }
    
    public String getArtist() {
        return artist;
    }
    
    public String getAlbum() {
        return album;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public String getId() {
        return id;
    }
    
    public String getDuration() {
        return duration;
    }
}
