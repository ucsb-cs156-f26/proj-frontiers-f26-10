package edu.ucsb.cs156.frontiers.services;

import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.TeamMember;
import edu.ucsb.cs156.frontiers.repositories.TeamMemberRepository;
import jakarta.persistence.EntityManager;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentDropService {

  @Autowired private TeamMemberRepository teamMemberRepository;

  @Autowired private EntityManager entityManager;

  /** Handles cleanup when a student drops the course or is deleted from the roster. */
  @Transactional
  public void dropStudent(RosterStudent rosterStudent) {
    if (rosterStudent.getTeamMembers() == null || rosterStudent.getTeamMembers().isEmpty()) {
      return;
    }
    List<TeamMember> teamMembers = new ArrayList<>(rosterStudent.getTeamMembers());
    for (TeamMember teamMember : teamMembers) {
      teamMember.getTeam().getTeamMembers().remove(teamMember);
    }
    rosterStudent.setTeamMembers(new ArrayList<>());
    // Keep the required team reference intact until the membership row is deleted.
    teamMemberRepository.deleteAllInBatch(teamMembers);
    // Bulk deletion leaves these entities managed; detach them before deleting the student.
    teamMembers.forEach(entityManager::detach);
  }
}
