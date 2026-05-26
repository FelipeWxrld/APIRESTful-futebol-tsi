package com.example.footballapi;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Pageable;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class LeagueModelAssembler implements RepresentationModelAssembler<League, EntityModel<League>> {

    @Override
    public EntityModel<League> toModel(League league) {
        EntityModel<League> model = EntityModel.of(league);

        try {
            model.add(linkTo(methodOn(LeagueController.class).one(league.getId())).withSelfRel());
            model.add(linkTo(methodOn(LeagueController.class).all(Pageable.unpaged())).withRel("leagues"));
            model.add(linkTo(methodOn(LeagueController.class).update(league.getId(), null)).withRel("update"));
            model.add(linkTo(methodOn(LeagueController.class).delete(league.getId())).withRel("delete"));
        } catch (Exception e) {
            // Silencia
        }

        return model;
    }
}
