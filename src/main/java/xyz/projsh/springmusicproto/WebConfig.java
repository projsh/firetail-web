package xyz.projsh.springmusicproto;

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
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String musicLoc = String.format("file:/%s", new SpringMusicProto().musLoc);
        System.out.println(musicLoc);
        registry.addResourceHandler("/audio/**").addResourceLocations(musicLoc);
        registry.addResourceHandler("/**").addResourceLocations("classpath:/static/");
    }
    
}