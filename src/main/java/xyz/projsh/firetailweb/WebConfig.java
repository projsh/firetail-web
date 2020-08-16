package xyz.projsh.firetailweb;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/error").setViewName("forward:/index.html");
        registry.addViewController("/prototype").setViewName("forward:/prototype/index.html");
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String musicLoc = "";
        String imgLoc = "";
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            musicLoc = String.format("file:\\%s", Database.dataDir);
            imgLoc = String.format("file:\\%s\\", Database.imgDir);
        } else {
            musicLoc = String.format("file:%s", Database.dataDir);
            imgLoc = String.format("file:%s/", Database.imgDir);
        }
        System.out.println(musicLoc);
        System.out.println(imgLoc);
        registry.addResourceHandler("/audio/**").addResourceLocations(musicLoc);
        registry.addResourceHandler("/img/**").addResourceLocations(imgLoc);
        registry.addResourceHandler("/**").addResourceLocations("classpath:/static/");
    }
    
}