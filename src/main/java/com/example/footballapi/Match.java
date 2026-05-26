package com.example.footballapi;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;

@Entity
@Table(name = "matches")
@Schema(description = "Entidade que representa uma Partida de futebol")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único da partida", example = "1", readOnly = true)
    private Long id;

    @NotNull(message = "O time da casa é obrigatório.")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "home_team_id")
    @Schema(description = "Time jogando em casa")
    private Team homeTeam;

    @NotNull(message = "O time visitante é obrigatório.")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "away_team_id")
    @Schema(description = "Time visitante")
    private Team awayTeam;

    @NotNull(message = "A data da partida é obrigatória.")
    @Schema(description = "Data de realização do jogo", example = "2026-05-24")
    private LocalDate date;

    @NotBlank(message = "O placar é obrigatório (utilize '0-0' para partidas que não iniciaram).")
    @Pattern(regexp = "^\\d+-\\d+$", message = "O placar deve estar no formato 'gols_casa-gols_visitante', ex: '2-1'")
    @Schema(description = "Placar final ou atual da partida", example = "2-1")
    private String score;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "stadium_id")
    @Schema(description = "Estádio onde a partida é disputada")
    private Stadium stadium;

    public Match() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Team getHomeTeam() { return homeTeam; }
    public void setHomeTeam(Team homeTeam) { this.homeTeam = homeTeam; }
    public Team getAwayTeam() { return awayTeam; }
    public void setAwayTeam(Team awayTeam) { this.awayTeam = awayTeam; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getScore() { return score; }
    public void setScore(String score) { this.score = score; }
    public Stadium getStadium() { return stadium; }
    public void setStadium(Stadium stadium) { this.stadium = stadium; }
}
