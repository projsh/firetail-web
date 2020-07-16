package xyz.projsh.firetailweb.api;

public class AllSongs {
    
    private final String title;
    private final String artist;
    private final String album;
    private final String fileName;
    
    public AllSongs(String title, String artist, String album, String fileName) {
        this.title = title;
        this.artist = artist;
        this.album = album;
        this.fileName = fileName;
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
}
