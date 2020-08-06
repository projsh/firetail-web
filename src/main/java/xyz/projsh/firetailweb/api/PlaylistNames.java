package xyz.projsh.firetailweb.api;

public class PlaylistNames {
    
    private final String name;
    private final String id;
    
    public PlaylistNames(String name, String id) {
        this.name = name;
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public String getId() {
        return id;
    }
    
}
