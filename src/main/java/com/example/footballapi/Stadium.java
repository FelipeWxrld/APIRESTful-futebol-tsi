package com.example.footballapi;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import io.swagger.v3.oas.annotations.media.Schema;

@Entity
@Table(name = "stadiums")
@Schema(description = "Entidade que representa um Estádio de futebol")
public class Stadium {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único do estádio", example = "1", readOnly = true)
    private Long id;

    @NotBlank(message = "O nome do estádio é obrigatório.")
    @Schema(description = "Nome do estádio", example = "Camp Nou")
    private String name;

    @NotBlank(message = "A cidade do estádio é obrigatória.")
    @Schema(description = "Cidade onde o estádio está localizado", example = "Barcelona")
    private String city;

    @Min(value = 1000, message = "A capacidade mínima do estádio é 1.000 pessoas.")
    @Schema(description = "Capacidade de público do estádio", example = "99354")
    private int capacity;

    @NotBlank(message = "O tipo de gramado é obrigatório.")
    @Schema(description = "Tipo de grama (Natural, Sintético, Híbrido)", example = "Natural")
    private String type; // Tipo de gramado

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id", unique = true)
    @Schema(description = "Time proprietário do estádio")
    private Team team;

    public Stadium() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
}
