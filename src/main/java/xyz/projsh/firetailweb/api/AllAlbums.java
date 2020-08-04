package xyz.projsh.firetailweb.api;

public class AllAlbums {
    
    private final String name;
    private final String artist;
    
    public AllAlbums(String name, String artist) {
        this.name = name;
        this.artist = artist;
    }
    
    public String getName() {
        return name;
    }
    
    public String getArtist() {
        return artist;
    }
    
}
