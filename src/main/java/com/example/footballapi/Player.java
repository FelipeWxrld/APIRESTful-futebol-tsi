package com.example.footballapi;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import io.swagger.v3.oas.annotations.media.Schema;

@Entity
@Table(name = "players")
@Schema(description = "Entidade que representa um Jogador de futebol")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "ID único do jogador", example = "1", readOnly = true)
    private Long id;

    @NotBlank(message = "O nome do jogador é obrigatório.")
    @Size(min = 2, max = 100, message = "O nome deve ter entre 2 e 100 caracteres.")
    @Schema(description = "Nome completo do jogador", example = "Lionel Messi")
    private String name;

    @Min(value = 15, message = "A idade mínima é 15 anos.")
    @Max(value = 50, message = "A idade máxima é 50 anos.")
    @Schema(description = "Idade do jogador", example = "35")
    private int age;

    @NotNull(message = "A posição do jogador é obrigatória.")
    @Enumerated(EnumType.STRING)
    @Schema(description = "Posição tática do jogador no campo", example = "FORWARD")
    private Position position;

    @Min(value = 1, message = "O número da camisa deve ser maior que 0.")
    @Max(value = 99, message = "O número da camisa não pode ser maior que 99.")
    @Schema(description = "Número da camisa do jogador", example = "10")
    private int number;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id")
    @Schema(description = "Time ao qual o jogador pertence")
    private Team team;

    public Player() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getAge() { return age; }
    public void setAge(int age) { this.age = age; }
    public Position getPosition() { return position; }
    public void setPosition(Position position) { this.position = position; }
    public int getNumber() { return number; }
    public void setNumber(int number) { this.number = number; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
}
