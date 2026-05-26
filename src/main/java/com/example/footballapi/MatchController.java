package com.example.footballapi;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/match")
public class MatchController {

    private final MatchRepository repository;
    private final MatchModelAssembler assembler;

    public MatchController(MatchRepository repository,
                           MatchModelAssembler assembler) {
        this.repository = repository;
        this.assembler = assembler;
    }

    @GetMapping
    public Page<Match> all(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @GetMapping("/{id}")
    public EntityModel<Match> one(@PathVariable Long id) {

        Match match = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Partida não encontrada"));

        return assembler.toModel(match);
    }

    @PostMapping
    public Match create(@RequestBody Match match) {
        return repository.save(match);
    }

    @PutMapping("/{id}")
    public Match update(@PathVariable Long id,
                        @RequestBody Match updatedMatch) {

        return repository.findById(id)
                .map(match -> {

                    match.setHomeTeam(updatedMatch.getHomeTeam());
                    match.setAwayTeam(updatedMatch.getAwayTeam());
                    match.setDate(updatedMatch.getDate());

                    return repository.save(match);

                }).orElseGet(() -> {

                    updatedMatch.setId(id);
                    return repository.save(updatedMatch);

                });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        repository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}