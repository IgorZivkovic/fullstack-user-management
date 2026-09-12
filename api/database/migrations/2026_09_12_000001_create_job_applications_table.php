<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->restrictOnDelete();
            $table->string('position', 160);
            $table->enum('status', ['saved', 'applied', 'interview', 'offer', 'rejected', 'withdrawn']);
            $table->enum('work_mode', ['onsite', 'hybrid', 'remote']);
            $table->string('employment_type', 80)->nullable();
            $table->string('source_url', 2048)->nullable();
            $table->date('applied_at')->nullable();
            $table->dateTime('next_action_at')->nullable();
            $table->decimal('salary_min', 12, 2)->nullable();
            $table->decimal('salary_max', 12, 2)->nullable();
            $table->char('currency', 3)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status']);
            $table->index(['company_id', 'work_mode']);
            $table->index('applied_at');
            $table->index('next_action_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_applications');
    }
};
