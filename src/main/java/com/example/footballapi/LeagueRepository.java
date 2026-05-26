
package com.example.footballapi;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface LeagueRepository extends JpaRepository<League,Long> {
List<League> findByNameContaining(String name);
}
