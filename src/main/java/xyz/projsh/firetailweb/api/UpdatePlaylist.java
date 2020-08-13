package xyz.projsh.firetailweb.api;

import java.util.List;

public class UpdatePlaylist {
    
    private String name;
    private String desc;
    private String imgData;
    private List<String> songs;
    private String id;
    
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
