package edu.ucsb.cs156.frontiers.services;

import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.TeamMember;
import edu.ucsb.cs156.frontiers.repositories.TeamMemberRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentDropService {

  @Autowired private TeamMemberRepository teamMemberRepository;

  /** Handles cleanup when a student drops the course or is deleted from the roster. */
  @Transactional
  public void dropStudent(RosterStudent rosterStudent) {
    if (rosterStudent.getTeamMembers() == null || rosterStudent.getTeamMembers().isEmpty()) {
      return;
    }
    List<TeamMember> teamMembers = new ArrayList<>(rosterStudent.getTeamMembers());
    for (TeamMember teamMember : teamMembers) {
      teamMember.getTeam().getTeamMembers().remove(teamMember);
      teamMember.setTeam(null);
    }
    rosterStudent.setTeamMembers(new ArrayList<>());
    // Bulk deletion avoids cascading merges of detached team members.
    teamMemberRepository.deleteAllInBatch(teamMembers);
  }
}
