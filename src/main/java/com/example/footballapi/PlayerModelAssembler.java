package com.example.footballapi;

import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;
import org.springframework.data.domain.Pageable;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;

@Component
public class PlayerModelAssembler implements RepresentationModelAssembler<Player, EntityModel<Player>> {

    @Override
    public EntityModel<Player> toModel(Player player) {
        EntityModel<Player> model = EntityModel.of(player);

        try {
            model.add(linkTo(methodOn(PlayerController.class).one(player.getId())).withSelfRel());
            model.add(linkTo(methodOn(PlayerController.class).all(Pageable.unpaged())).withRel("players"));
            model.add(linkTo(methodOn(PlayerController.class).update(player.getId(), null)).withRel("update"));
            model.add(linkTo(methodOn(PlayerController.class).delete    (player.getId())).withRel("delete"));
        } catch (Exception e) {
            // Silencia falhas caso ocorra erro ao construir links dinamicamente antes de inicializar o contexto completo
        }

        return model;
    }
}
