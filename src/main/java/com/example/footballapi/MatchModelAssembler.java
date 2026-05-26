package com.example.footballapi;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class MatchModelAssembler
        implements RepresentationModelAssembler<Match, EntityModel<Match>> {

    @Override
    public EntityModel<Match> toModel(Match match) {

        return EntityModel.of(match,

                linkTo(methodOn(MatchController.class)
                        .one(match.getId())).withSelfRel(),

                linkTo(methodOn(MatchController.class)
                        .all(null)).withRel("matches"),

                linkTo(methodOn(MatchController.class)
                        .delete(match.getId())).withRel("delete")
        );
    }
}