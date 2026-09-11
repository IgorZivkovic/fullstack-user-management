import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { User } from '../models/user.model';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('maps Laravel pagination and query parameters to service state', () => {
    const user: User = {
      id: 6,
      name: 'Maya Novak',
      birthday: '1994-06-12',
      gender: 'female',
      country: 'Serbia',
    };

    service.fetchFromApi({
      page: 2,
      pageSize: 5,
      search: '  maya  ',
      gender: 'female',
    });

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/users');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('per_page')).toBe('5');
    expect(request.request.params.get('search')).toBe('maya');
    expect(request.request.params.get('gender')).toBe('female');

    request.flush({
      data: [user],
      links: {
        first: 'http://127.0.0.1:8000/api/v1/users?page=1',
        last: 'http://127.0.0.1:8000/api/v1/users?page=3',
        prev: 'http://127.0.0.1:8000/api/v1/users?page=1',
        next: 'http://127.0.0.1:8000/api/v1/users?page=3',
      },
      meta: {
        current_page: 2,
        from: 6,
        last_page: 3,
        links: [],
        path: 'http://127.0.0.1:8000/api/v1/users',
        per_page: 5,
        to: 6,
        total: 11,
      },
    });

    expect(service.users()).toEqual([user]);
    expect(service.page()).toBe(2);
    expect(service.pageSize()).toBe(5);
    expect(service.total()).toBe(11);
    expect(service.loading()).toBe(false);
  });
});
