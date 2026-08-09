package com.sulultours;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SululToursApplication {
    public static void main(String[] args) {
        SpringApplication.run(SululToursApplication.class, args);
    }

    @Bean
    public CommandLineRunner commandLineRunner() {
        return args -> {
            System.out.println("🚀 SULUL TOURS BACKEND IS RUNNING! 🚀");
            System.out.println("📱 Travel Agency Management System");
        };
    }
}