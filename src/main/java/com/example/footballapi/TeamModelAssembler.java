package com.example.footballapi;

import org.springframework.data.domain.Pageable;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class TeamModelAssembler
        implements RepresentationModelAssembler<Team, EntityModel<Team>> {

    @Override
    public EntityModel<Team> toModel(Team team) {

        return EntityModel.of(team,

                linkTo(methodOn(TeamController.class)
                        .one(team.getId())).withSelfRel(),

                linkTo(methodOn(TeamController.class)
                        .all(Pageable.unpaged())).withRel("teams"),

                linkTo(methodOn(TeamController.class)
                        .update(team.getId(), null)).withRel("update"),

                linkTo(methodOn(TeamController.class)
                        .delete(team.getId())).withRel("delete")
        );
    }
}