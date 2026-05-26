package com.example.footballapi;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Pageable;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class StadiumModelAssembler implements RepresentationModelAssembler<Stadium, EntityModel<Stadium>> {

    @Override
    public EntityModel<Stadium> toModel(Stadium stadium) {
        EntityModel<Stadium> model = EntityModel.of(stadium);

        try {
            model.add(linkTo(methodOn(StadiumController.class).one(stadium.getId())).withSelfRel());
            model.add(linkTo(methodOn(StadiumController.class).all(Pageable.unpaged())).withRel("stadiums"));
            model.add(linkTo(methodOn(StadiumController.class).update(stadium.getId(), null)).withRel("update"));
            model.add(linkTo(methodOn(StadiumController.class).delete(stadium.getId())).withRel("delete"));
        } catch (Exception e) {
            // Silencia
        }

        return model;
    }
}
