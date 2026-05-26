
package com.example.footballapi;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TeamRepository extends JpaRepository<Team,Long> {
List<Team> findByNameContaining(String name);
}
