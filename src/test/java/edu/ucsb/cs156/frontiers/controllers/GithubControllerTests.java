package edu.ucsb.cs156.frontiers.controllers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.security.test.web.servlet.response.SecurityMockMvcResultMatchers.authenticated;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.ucsb.cs156.frontiers.ControllerTestCase;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.entities.RosterStudent;
import edu.ucsb.cs156.frontiers.entities.User;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.repositories.RosterStudentRepository;
import edu.ucsb.cs156.frontiers.repositories.UserRepository;
import edu.ucsb.cs156.frontiers.services.CurrentUserService;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(controllers = GithubController.class)
public class GithubControllerTests extends ControllerTestCase {

  @MockitoBean private UserRepository userRepository;
  @MockitoBean private RosterStudentRepository rosterStudentRepository;

  @MockitoBean private CourseStaffRepository courseStaffRepository;

  @Autowired private CurrentUserService currentUserService;

  @Test
  public void successfulDisconnect() throws Exception {
    when(rosterStudentRepository.findAllByUser(any(User.class))).thenReturn(List.of());

    when(courseStaffRepository.findAllByUser(any(User.class))).thenReturn(List.of());

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

    MvcResult response =
        mockMvc
            .perform(
                delete("/api/github/disconnect")
                    .with(csrf())
                    .with(
                        oidcLogin()
                            .authorities(
                                new SimpleGrantedAuthority("ROLE_USER"),
                                new SimpleGrantedAuthority("ROLE_GITHUB"))))
            .andExpect(status().isOk())
            .andExpect(authenticated().withRoles("USER"))
            .andReturn();

    verify(userRepository).save(userCaptor.capture());

    assertNull(userCaptor.getValue().getGithubId());
    assertNull(userCaptor.getValue().getGithubLogin());

    Map<String, Object> json = responseToJson(response);
    assertEquals(
        "Disconnected from GitHub. You may now log in with a different account.",
        json.get("message"));
  }

  private void performDisconnect() throws Exception {
    mockMvc
        .perform(
            delete("/api/github/disconnect")
                .with(csrf())
                .with(
                    oidcLogin()
                        .authorities(
                            new SimpleGrantedAuthority("ROLE_USER"),
                            new SimpleGrantedAuthority("ROLE_GITHUB"))))
        .andExpect(status().isOk())
        .andExpect(authenticated().withRoles("USER"));
  }

  @ParameterizedTest
  @EnumSource(OrgStatus.class)
  public void disconnect_resets_only_invited_students(OrgStatus originalStatus) throws Exception {

    List<RosterStudent> students =
        List.of(
            RosterStudent.builder()
                .id(1L)
                .orgStatus(originalStatus)
                .githubId(123)
                .githubLogin("old-account")
                .build(),
            RosterStudent.builder()
                .id(2L)
                .orgStatus(originalStatus)
                .githubId(123)
                .githubLogin("old-account")
                .build());

    when(rosterStudentRepository.findAllByUser(any(User.class))).thenReturn(students);
    when(courseStaffRepository.findAllByUser(any(User.class))).thenReturn(List.of());

    performDisconnect();

    for (RosterStudent student : students) {
      if (originalStatus == OrgStatus.INVITED) {
        assertEquals(OrgStatus.JOINCOURSE, student.getOrgStatus());
        assertNull(student.getGithubId());
        assertNull(student.getGithubLogin());
        verify(rosterStudentRepository).save(student);
      } else {
        assertEquals(originalStatus, student.getOrgStatus());
        assertEquals(Integer.valueOf(123), student.getGithubId());
        assertEquals("old-account", student.getGithubLogin());
      }
    }

    if (originalStatus != OrgStatus.INVITED) {
      verify(rosterStudentRepository, never()).save(any(RosterStudent.class));
    }

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    verify(rosterStudentRepository).findAllByUser(userCaptor.capture());
    assertEquals(1L, userCaptor.getValue().getId());
  }

  @ParameterizedTest
  @EnumSource(OrgStatus.class)
  public void disconnect_resets_only_invited_staff(OrgStatus originalStatus) throws Exception {

    List<CourseStaff> staffMembers =
        List.of(
            CourseStaff.builder()
                .id(1L)
                .orgStatus(originalStatus)
                .githubId(123)
                .githubLogin("old-account")
                .build(),
            CourseStaff.builder()
                .id(2L)
                .orgStatus(originalStatus)
                .githubId(123)
                .githubLogin("old-account")
                .build());

    when(rosterStudentRepository.findAllByUser(any(User.class))).thenReturn(List.of());
    when(courseStaffRepository.findAllByUser(any(User.class))).thenReturn(staffMembers);

    performDisconnect();

    for (CourseStaff staff : staffMembers) {
      if (originalStatus == OrgStatus.INVITED) {
        assertEquals(OrgStatus.JOINCOURSE, staff.getOrgStatus());
        assertNull(staff.getGithubId());
        assertNull(staff.getGithubLogin());
        verify(courseStaffRepository).save(staff);
      } else {
        assertEquals(originalStatus, staff.getOrgStatus());
        assertEquals(Integer.valueOf(123), staff.getGithubId());
        assertEquals("old-account", staff.getGithubLogin());
      }
    }

    if (originalStatus != OrgStatus.INVITED) {
      verify(courseStaffRepository, never()).save(any(CourseStaff.class));
    }

    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
    verify(courseStaffRepository).findAllByUser(userCaptor.capture());
    assertEquals(1L, userCaptor.getValue().getId());
  }
}
