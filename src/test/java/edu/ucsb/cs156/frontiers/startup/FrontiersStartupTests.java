package edu.ucsb.cs156.frontiers.startup;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import edu.ucsb.cs156.frontiers.entities.Admin;
import edu.ucsb.cs156.frontiers.entities.Course;
import edu.ucsb.cs156.frontiers.entities.CourseStaff;
import edu.ucsb.cs156.frontiers.entities.User;
import edu.ucsb.cs156.frontiers.enums.OrgStatus;
import edu.ucsb.cs156.frontiers.repositories.AdminRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseRepository;
import edu.ucsb.cs156.frontiers.repositories.CourseStaffRepository;
import edu.ucsb.cs156.frontiers.repositories.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

class FrontiersStartupTests {

  @Mock private AdminRepository adminRepository;

  @Mock private CourseRepository courseRepository;

  @Mock private CourseStaffRepository courseStaffRepository;

  @Mock private UserRepository userRepository;

  private FrontiersStartup frontiersStartup;

  @BeforeEach
  void setUp() {
    MockitoAnnotations.openMocks(this);
    frontiersStartup = new FrontiersStartup();
    frontiersStartup.adminRepository = adminRepository;
    frontiersStartup.courseRepository = courseRepository;
    frontiersStartup.courseStaffRepository = courseStaffRepository;
    frontiersStartup.userRepository = userRepository;
    frontiersStartup.adminEmails = List.of("acdamstedt@ucsb.edu", "phtcon@ucsb.edu");
  }

  @Test
  void test_AlwaysRunOnStartup_saves_admins() {
    frontiersStartup.webhookSecret = "valid_secret_123";
    frontiersStartup.alwaysRunOnStartup();

    verify(adminRepository).save(new Admin("acdamstedt@ucsb.edu"));
    verify(adminRepository).save(new Admin("phtcon@ucsb.edu"));
    verifyNoMoreInteractions(adminRepository);
  }

  @Test
  void test_AlwaysRunOnStartup_handles_exception() {
    frontiersStartup.webhookSecret = "valid_secret_123";
    doThrow(new RuntimeException("Simulated error")).when(adminRepository).save(any(Admin.class));

    frontiersStartup.alwaysRunOnStartup();

    verify(adminRepository, times(1)).save(any(Admin.class));
  }

  @Test
  void test_AlwaysRunOnStartup_fails_with_short_webhook_secret() {
    frontiersStartup.webhookSecret = "short";

    IllegalStateException exception =
        assertThrows(IllegalStateException.class, () -> frontiersStartup.alwaysRunOnStartup());

    assertTrue(
        exception.getMessage().contains("WEBHOOK_SECRET must be at least 10 characters long"));
    assertTrue(exception.getMessage().contains("Current length: 5"));
    verifyNoInteractions(adminRepository);
  }

  @Test
  void test_AlwaysRunOnStartup_fails_with_null_webhook_secret() {
    frontiersStartup.webhookSecret = null;

    IllegalStateException exception =
        assertThrows(IllegalStateException.class, () -> frontiersStartup.alwaysRunOnStartup());

    assertTrue(
        exception.getMessage().contains("WEBHOOK_SECRET must be at least 10 characters long"));
    assertTrue(exception.getMessage().contains("Current length: 0"));
    verifyNoInteractions(adminRepository);
  }

  @Test
  void test_AlwaysRunOnStartup_succeeds_with_minimum_length_webhook_secret() {
    frontiersStartup.webhookSecret = "1234567890"; // exactly 10 characters

    frontiersStartup.alwaysRunOnStartup();

    verify(adminRepository).save(new Admin("acdamstedt@ucsb.edu"));
    verify(adminRepository).save(new Admin("phtcon@ucsb.edu"));
    verifyNoMoreInteractions(adminRepository);
  }

  @Test
  void test_addsInstructorAsStaff_whenNoUser() {
    frontiersStartup.webhookSecret = "valid_secret_123";
    Course course = Course.builder().id(1L).instructorEmail("prof@ucsb.edu").build();
    when(courseRepository.findAll()).thenReturn(List.of(course));
    when(courseStaffRepository.findByEmailAndCourse("prof@ucsb.edu", course))
        .thenReturn(Optional.empty());
    when(userRepository.findByEmail("prof@ucsb.edu")).thenReturn(Optional.empty());

    frontiersStartup.alwaysRunOnStartup();

    ArgumentCaptor<CourseStaff> captor = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository).save(captor.capture());
    CourseStaff saved = captor.getValue();
    assertEquals("", saved.getFirstName());
    assertEquals("", saved.getLastName());
    assertEquals("prof@ucsb.edu", saved.getEmail());
    assertSame(course, saved.getCourse());
    assertEquals(OrgStatus.PENDING, saved.getOrgStatus());
    assertNull(saved.getUser());
  }

  @Test
  void test_addsInstructorAsStaff_whenUserExists() {
    frontiersStartup.webhookSecret = "valid_secret_123";
    Course course =
        Course.builder().id(2L).instructorEmail("prof@ucsb.edu").installationId("12345").build();
    User user =
        User.builder().email("prof@ucsb.edu").givenName("Proffirst").familyName("Proflast").build();
    when(courseRepository.findAll()).thenReturn(List.of(course));
    when(courseStaffRepository.findByEmailAndCourse("prof@ucsb.edu", course))
        .thenReturn(Optional.empty());
    when(userRepository.findByEmail("prof@ucsb.edu")).thenReturn(Optional.of(user));

    frontiersStartup.alwaysRunOnStartup();

    ArgumentCaptor<CourseStaff> captor = ArgumentCaptor.forClass(CourseStaff.class);
    verify(courseStaffRepository).save(captor.capture());
    CourseStaff saved = captor.getValue();
    assertEquals("Proffirst", saved.getFirstName());
    assertEquals("Proflast", saved.getLastName());
    assertEquals("prof@ucsb.edu", saved.getEmail());
    assertSame(course, saved.getCourse());
    assertEquals(OrgStatus.JOINCOURSE, saved.getOrgStatus());
    assertSame(user, saved.getUser());
  }

  @Test
  void test_doesNotAddInstructor_whenAlreadyStaff() {
    frontiersStartup.webhookSecret = "valid_secret_123";
    Course course = Course.builder().id(3L).instructorEmail("prof@ucsb.edu").build();
    CourseStaff existingStaff =
        CourseStaff.builder()
            .firstName("Proffirst")
            .lastName("Proflast")
            .email("prof@ucsb.edu")
            .course(course)
            .build();
    when(courseRepository.findAll()).thenReturn(List.of(course));
    when(courseStaffRepository.findByEmailAndCourse("prof@ucsb.edu", course))
        .thenReturn(Optional.of(existingStaff));

    frontiersStartup.alwaysRunOnStartup();

    verify(courseStaffRepository, never()).save(any(CourseStaff.class));
    verifyNoInteractions(userRepository);
  }

  @Test
  void test_skipsCourse_whenInstructorEmailIsNull() {
    frontiersStartup.webhookSecret = "valid_secret_123";
    Course course = Course.builder().id(4L).instructorEmail(null).build();
    when(courseRepository.findAll()).thenReturn(List.of(course));

    frontiersStartup.alwaysRunOnStartup();

    verifyNoInteractions(courseStaffRepository, userRepository);
  }

  @Test
  void test_skipsCourse_whenInstructorEmailIsBlank() {
    frontiersStartup.webhookSecret = "valid_secret_123";
    Course course = Course.builder().id(5L).instructorEmail("   ").build();
    when(courseRepository.findAll()).thenReturn(List.of(course));

    frontiersStartup.alwaysRunOnStartup();

    verifyNoInteractions(courseStaffRepository, userRepository);
  }

  @Test
  void test_addMissingInstructors_handlesException() {
    frontiersStartup.webhookSecret = "valid_secret_123";
    when(courseRepository.findAll()).thenThrow(new RuntimeException("Simulated error"));

    assertDoesNotThrow(() -> frontiersStartup.alwaysRunOnStartup());

    verifyNoInteractions(courseStaffRepository, userRepository);
  }
}
