<?php

namespace Database\Seeders;

use App\Enums\InterviewOutcome;
use App\Enums\InterviewType;
use App\Enums\JobApplicationStatus;
use App\Enums\WorkMode;
use App\Models\AuthUser;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use RuntimeException;

class JobTrackerSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $accounts = AuthUser::query()
            ->whereIn('email', array_keys($this->demoData()))
            ->get()
            ->keyBy('email');

        foreach ($this->demoData() as $email => $companies) {
            $account = $accounts->get($email)
                ?? throw new RuntimeException("Demo account {$email} must exist before seeding job tracker data.");

            foreach ($companies as $companyData) {
                $applications = $companyData['applications'];
                unset($companyData['applications']);

                $company = $account->companies()->create($companyData);

                foreach ($applications as $applicationData) {
                    $interviews = $applicationData['interviews'] ?? [];
                    unset($applicationData['interviews']);

                    $application = $company->jobApplications()->create($applicationData);
                    $application->interviews()->createMany($interviews);
                }
            }
        }
    }

    private function demoData(): array
    {
        return [
            'admin@example.com' => [
                [
                    'name' => 'Northstar Labs',
                    'website' => 'https://northstar.example.com',
                    'location' => 'Berlin, Germany',
                    'notes' => 'Product company with a distributed engineering team.',
                    'applications' => [
                        [
                            'position' => 'Senior Angular Developer',
                            'status' => JobApplicationStatus::Applied,
                            'work_mode' => WorkMode::Remote,
                            'employment_type' => 'full-time',
                            'source_url' => 'https://northstar.example.com/jobs/angular-developer',
                            'applied_at' => '2026-08-20',
                            'next_action_at' => '2026-09-16 09:00:00',
                            'salary_min' => 70_000,
                            'salary_max' => 85_000,
                            'currency' => 'EUR',
                            'notes' => 'Follow up with the recruiter after the initial review.',
                        ],
                    ],
                ],
                [
                    'name' => 'Vertex Systems',
                    'website' => 'https://vertex.example.com',
                    'location' => 'Budapest, Hungary',
                    'notes' => null,
                    'applications' => [
                        [
                            'position' => 'Laravel Developer',
                            'status' => JobApplicationStatus::Interview,
                            'work_mode' => WorkMode::Hybrid,
                            'employment_type' => 'full-time',
                            'source_url' => 'https://vertex.example.com/careers/laravel-developer',
                            'applied_at' => '2026-08-10',
                            'next_action_at' => '2026-09-14 10:00:00',
                            'salary_min' => 65_000,
                            'salary_max' => 78_000,
                            'currency' => 'EUR',
                            'notes' => 'Prepare examples of API design and database optimization.',
                            'interviews' => [
                                [
                                    'type' => InterviewType::Screening,
                                    'scheduled_at' => '2026-08-18 11:00:00',
                                    'contact_name' => 'Marta Kovacs',
                                    'contact_email' => 'marta@vertex.example.com',
                                    'location_or_link' => 'https://meet.example.com/vertex-screening',
                                    'notes' => 'Introductory call with the recruiter.',
                                    'outcome' => InterviewOutcome::Passed,
                                ],
                                [
                                    'type' => InterviewType::Technical,
                                    'scheduled_at' => '2026-09-14 10:00:00',
                                    'contact_name' => 'Daniel Horvat',
                                    'contact_email' => 'daniel@vertex.example.com',
                                    'location_or_link' => 'https://meet.example.com/vertex-technical',
                                    'notes' => 'System design and pair-programming session.',
                                    'outcome' => null,
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    'name' => 'Blue Orbit',
                    'website' => null,
                    'location' => 'Remote',
                    'notes' => 'Early-stage SaaS company.',
                    'applications' => [
                        [
                            'position' => 'Full-stack Engineer',
                            'status' => JobApplicationStatus::Saved,
                            'work_mode' => WorkMode::Remote,
                            'employment_type' => 'contract',
                            'source_url' => 'https://jobs.example.com/blue-orbit-full-stack',
                            'notes' => 'Review the role before applying.',
                        ],
                        [
                            'position' => 'Frontend Lead',
                            'status' => JobApplicationStatus::Rejected,
                            'work_mode' => WorkMode::Remote,
                            'employment_type' => 'full-time',
                            'applied_at' => '2026-07-03',
                            'notes' => 'Good technical discussion, but the company chose an internal candidate.',
                            'interviews' => [
                                [
                                    'type' => InterviewType::Final,
                                    'scheduled_at' => '2026-07-21 14:00:00',
                                    'contact_name' => 'Elena Brooks',
                                    'contact_email' => 'elena@blue-orbit.example.com',
                                    'location_or_link' => 'https://meet.example.com/blue-orbit-final',
                                    'notes' => null,
                                    'outcome' => InterviewOutcome::Failed,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'viewer@example.com' => [
                [
                    'name' => 'Cedar Analytics',
                    'website' => 'https://cedar.example.com',
                    'location' => 'Amsterdam, Netherlands',
                    'notes' => null,
                    'applications' => [
                        [
                            'position' => 'UI Engineer',
                            'status' => JobApplicationStatus::Offer,
                            'work_mode' => WorkMode::Hybrid,
                            'employment_type' => 'full-time',
                            'applied_at' => '2026-07-15',
                            'next_action_at' => '2026-09-18 12:00:00',
                            'salary_min' => 72_000,
                            'salary_max' => 82_000,
                            'currency' => 'EUR',
                            'notes' => 'Offer review deadline is September 18.',
                            'interviews' => [
                                [
                                    'type' => InterviewType::Final,
                                    'scheduled_at' => '2026-08-28 13:30:00',
                                    'contact_name' => 'Sophie de Vries',
                                    'contact_email' => 'sophie@cedar.example.com',
                                    'location_or_link' => 'Cedar Analytics Amsterdam office',
                                    'notes' => 'Final conversation with the engineering manager.',
                                    'outcome' => InterviewOutcome::Passed,
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    'name' => 'Pixel Forge',
                    'website' => 'https://pixel-forge.example.com',
                    'location' => 'Remote',
                    'notes' => 'Design-focused product studio.',
                    'applications' => [
                        [
                            'position' => 'Frontend Developer',
                            'status' => JobApplicationStatus::Interview,
                            'work_mode' => WorkMode::Remote,
                            'employment_type' => 'full-time',
                            'source_url' => 'https://pixel-forge.example.com/jobs/frontend',
                            'applied_at' => '2026-08-27',
                            'next_action_at' => '2026-09-17 15:00:00',
                            'notes' => 'Prepare a walkthrough of a recent Angular project.',
                            'interviews' => [
                                [
                                    'type' => InterviewType::Hr,
                                    'scheduled_at' => '2026-09-17 15:00:00',
                                    'contact_name' => 'Nina Patel',
                                    'contact_email' => 'nina@pixel-forge.example.com',
                                    'location_or_link' => 'https://meet.example.com/pixel-forge-hr',
                                    'notes' => null,
                                    'outcome' => null,
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    'name' => 'Atlas Commerce',
                    'website' => null,
                    'location' => 'Vienna, Austria',
                    'notes' => null,
                    'applications' => [
                        [
                            'position' => 'PHP Developer',
                            'status' => JobApplicationStatus::Withdrawn,
                            'work_mode' => WorkMode::Onsite,
                            'employment_type' => 'contract',
                            'applied_at' => '2026-08-01',
                            'notes' => 'Role changed to fully onsite after applying.',
                            'interviews' => [
                                [
                                    'type' => InterviewType::Screening,
                                    'scheduled_at' => '2026-08-12 09:30:00',
                                    'contact_name' => 'Markus Steiner',
                                    'contact_email' => 'markus@atlas.example.com',
                                    'location_or_link' => 'https://meet.example.com/atlas-screening',
                                    'notes' => 'Cancelled after the work-mode change.',
                                    'outcome' => InterviewOutcome::Cancelled,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}
