package xyz.projsh.firetailweb.api;

import java.util.List;

public class UpdatePlaylist {
    
    private final String name;
    private final String desc;
    private final String imgData;
    private final List<String> songs;
    private final String id;
    
    public UpdatePlaylist() {
        super();
    }
    
    public String getName() {
        return name;
    }
    
    public String getDesc() {
        return desc;
    }
    
    public String getImgData() {
        return imgData;
    }
    
    public List<String> getSongs() {
        return songs;
    }
    
    public String getId() {
        return id;
    }
    
}
