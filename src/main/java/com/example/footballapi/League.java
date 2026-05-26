package com.example.footballapi;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Entity
@Table(name = "leagues")
@Schema(description = "Entidade que representa uma Liga de futebol")
public class League {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único da liga", example = "1", readOnly = true)
    private Long id;

    @NotBlank(message = "O nome da liga é obrigatório.")
    @Schema(description = "Nome da liga de futebol", example = "La Liga")
    private String name;

    @NotBlank(message = "O país da liga é obrigatório.")
    @Schema(description = "País sede da liga", example = "Espanha")
    private String country;

    @Min(value = 1, message = "O nível da liga deve ser pelo menos 1 (Ex: Série A).")
    @Schema(description = "Nível de divisão da liga (1 = Principal divisão)", example = "1")
    private int level;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "league_teams",
        joinColumns = @JoinColumn(name = "league_id"),
        inverseJoinColumns = @JoinColumn(name = "team_id")
    )
    @Schema(description = "Lista de times participantes desta liga")
    private List<Team> teams;

    public League() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public List<Team> getTeams() { return teams; }
    public void setTeams(List<Team> teams) { this.teams = teams; }
}
