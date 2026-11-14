package edu.ucsb.cs156.frontiers.services;

import static org.junit.jupiter.api.Assertions.assertEquals;

import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.Team;
import edu.ucsb.cs156.frontiers.entities.TeamMember;
import edu.ucsb.cs156.frontiers.enums.RosterStatus;
import edu.ucsb.cs156.frontiers.repositories.RosterStudentRepository;
import edu.ucsb.cs156.frontiers.repositories.TeamMemberRepository;
import edu.ucsb.cs156.frontiers.repositories.TeamRepository;
import edu.ucsb.cs156.jobs.entities.Job;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

@DataJpaTest(
    properties = {"spring.liquibase.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
@Import(StudentDropService.class)
@EntityScan(basePackageClasses = {Course.class, Job.class})
public class StudentDropServiceJpaTests {

  @Autowired private TestEntityManager entityManager;
  @Autowired private StudentDropService studentDropService;
  @Autowired private RosterStudentRepository rosterStudentRepository;
  @Autowired private TeamRepository teamRepository;
  @Autowired private TeamMemberRepository teamMemberRepository;

  @ParameterizedTest
  @ValueSource(booleans = {false, true})
  public void test_dropStudent_deletesMembershipsFromDatabase(boolean detached) {
    Course course = entityManager.persist(Course.builder().courseName("CS156").build());
    RosterStudent student =
        entityManager.persist(
            RosterStudent.builder()
                .course(course)
                .studentId("1234567")
                .email("dropped@ucsb.edu")
                .rosterStatus(RosterStatus.DROPPED)
                .build());
    Team team = entityManager.persist(Team.builder().name("Team A").course(course).build());
    TeamMember member =
        entityManager.persist(TeamMember.builder().team(team).rosterStudent(student).build());
    RosterStudent retainedStudent =
        entityManager.persist(
            RosterStudent.builder()
                .course(course)
                .studentId("7654321")
                .email("retained@ucsb.edu")
                .rosterStatus(RosterStatus.ROSTER)
                .build());
    Team otherTeam = entityManager.persist(Team.builder().name("Team B").course(course).build());
    TeamMember otherMembership =
        entityManager.persist(TeamMember.builder().team(otherTeam).rosterStudent(student).build());
    TeamMember retainedMembership =
        entityManager.persist(
            TeamMember.builder().team(team).rosterStudent(retainedStudent).build());
    student.setTeamMembers(new ArrayList<>(List.of(member, otherMembership)));
    retainedStudent.setTeamMembers(new ArrayList<>(List.of(retainedMembership)));
    team.setTeamMembers(new ArrayList<>(List.of(member, retainedMembership)));
    otherTeam.setTeamMembers(new ArrayList<>(List.of(otherMembership)));
    entityManager.flush();
    if (detached) {
      entityManager.clear();
    }

    studentDropService.dropStudent(student);
    rosterStudentRepository.save(student);
    entityManager.flush();
    entityManager.clear();

    assertEquals(1, teamMemberRepository.count());
    assertEquals(
        List.of(), rosterStudentRepository.findById(student.getId()).orElseThrow().getTeams());
    assertEquals(1, teamRepository.findById(team.getId()).orElseThrow().getTeamMembers().size());
    assertEquals(
        List.of(), teamRepository.findById(otherTeam.getId()).orElseThrow().getTeamMembers());
    assertEquals(
        List.of("Team A"),
        rosterStudentRepository.findById(retainedStudent.getId()).orElseThrow().getTeams());
  }
}
