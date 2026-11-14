package edu.ucsb.cs156.frontiers.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.Team;
import edu.ucsb.cs156.frontiers.entities.TeamMember;
import edu.ucsb.cs156.frontiers.repositories.TeamMemberRepository;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class StudentDropServiceTests {

  @Mock private TeamMemberRepository teamMemberRepository;

  @InjectMocks private StudentDropService studentDropService;

  @Test
  public void test_dropStudent_removesStudentFromAllTeams() {
    RosterStudent student = RosterStudent.builder().id(1L).build();
    RosterStudent otherStudent = RosterStudent.builder().id(2L).build();
    Team team1 = Team.builder().id(1L).name("Team A").build();
    Team team2 = Team.builder().id(2L).name("Team B").build();
    TeamMember member1 = TeamMember.builder().id(1L).team(team1).rosterStudent(student).build();
    TeamMember member2 = TeamMember.builder().id(2L).team(team2).rosterStudent(student).build();
    TeamMember otherMember =
        TeamMember.builder().id(3L).team(team1).rosterStudent(otherStudent).build();
    team1.setTeamMembers(new ArrayList<>(List.of(member1, otherMember)));
    team2.setTeamMembers(new ArrayList<>(List.of(member2)));
    student.setTeamMembers(new ArrayList<>(List.of(member1, member2)));
    otherStudent.setTeamMembers(new ArrayList<>(List.of(otherMember)));

    studentDropService.dropStudent(student);

    assertEquals(List.of(), student.getTeamMembers());
    assertEquals(List.of(), student.getTeams());
    assertEquals(List.of(otherMember), team1.getTeamMembers());
    assertEquals(List.of(), team2.getTeamMembers());
    assertEquals(List.of(otherMember), otherStudent.getTeamMembers());
    assertNull(member1.getTeam());
    assertNull(member2.getTeam());
    verify(teamMemberRepository).deleteAllInBatch(List.of(member1, member2));
    verifyNoMoreInteractions(teamMemberRepository);

    studentDropService.dropStudent(student);

    verifyNoMoreInteractions(teamMemberRepository);
  }

  @Test
  public void test_dropStudent_withNoTeams() {
    RosterStudent student = RosterStudent.builder().teamMembers(List.of()).build();

    studentDropService.dropStudent(student);

    assertEquals(List.of(), student.getTeamMembers());
    verifyNoInteractions(teamMemberRepository);
  }

  @Test
  public void test_dropStudent_withNullTeamMembers() {
    RosterStudent student = RosterStudent.builder().build();

    studentDropService.dropStudent(student);

    verifyNoInteractions(teamMemberRepository);
  }
}
