package com.template.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * General Web MVC Configuration.
 * Extend this class to add interceptors, formatters, view resolvers, etc.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Add custom interceptors, message converters, etc. here as needed.
}
