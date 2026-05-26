package com.example.footballapi;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Entity
@Table(name = "teams")
@Schema(description = "Entidade que representa um Time de futebol")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único do time", example = "1", readOnly = true)
    private Long id;

    @NotBlank(message = "O nome do time é obrigatório.")
    @Size(min = 2, max = 100, message = "O nome do time deve ter entre 2 e 100 caracteres.")
    @Schema(description = "Nome do time de futebol", example = "Barcelona")
    private String name;

    @NotBlank(message = "A cidade do time é obrigatória.")
    @Schema(description = "Cidade sede do time", example = "Barcelona")
    private String city;

    @NotBlank(message = "O treinador do time é obrigatório.")
    @Schema(description = "Nome do treinador principal", example = "Hansi Flick")
    private String coach;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("team")
    @Schema(description = "Lista de jogadores que pertencem a este time")
    private List<Player> players;

    public Team() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getCoach() { return coach; }
    public void setCoach(String coach) { this.coach = coach; }
    public List<Player> getPlayers() { return players; }
    public void setPlayers(List<Player> players) { this.players = players; }
}
