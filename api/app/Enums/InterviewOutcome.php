<?php

namespace App\Enums;

enum InterviewOutcome: string
{
    case Passed = 'passed';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
}
