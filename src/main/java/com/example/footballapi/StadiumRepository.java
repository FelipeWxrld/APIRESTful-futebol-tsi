
package com.example.footballapi;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface StadiumRepository extends JpaRepository<Stadium,Long> {
List<Stadium> findByNameContaining(String name);
}
