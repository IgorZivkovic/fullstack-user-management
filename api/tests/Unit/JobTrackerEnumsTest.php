<?php

namespace Tests\Unit;

use App\Enums\InterviewOutcome;
use App\Enums\InterviewType;
use App\Enums\JobApplicationStatus;
use App\Enums\WorkMode;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class JobTrackerEnumsTest extends TestCase
{
    public static function enumValuesProvider(): array
    {
        return [
            'application statuses' => [
                JobApplicationStatus::class,
                ['saved', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'],
            ],
            'work modes' => [WorkMode::class, ['onsite', 'hybrid', 'remote']],
            'interview types' => [InterviewType::class, ['screening', 'technical', 'hr', 'final']],
            'interview outcomes' => [InterviewOutcome::class, ['passed', 'failed', 'cancelled']],
        ];
    }

    #[DataProvider('enumValuesProvider')]
    public function test_enum_exposes_the_expected_api_values(string $enumClass, array $expected): void
    {
        $actual = array_map(
            static fn (\BackedEnum $case): string => $case->value,
            $enumClass::cases(),
        );

        $this->assertSame($expected, $actual);
    }
}
